from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction
from django.http import HttpResponse
from django.db.models import Max
import logging
import io 
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from django.views.decorators.csrf import csrf_exempt
from attendance.models import Professor, Class, AttendanceLog, AttendanceSystemRegistration
from attendance.serializers import ProfessorSerializer, ClassSerializer
import bcrypt

logger = logging.getLogger(__name__)


@api_view(['POST'])
def professor_create_class(request):
    # Extracting data from the POST request
    data = request.data
    course_name = data.get('courseName', '').strip()
    crn = data.get('crn', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not course_name or not crn or not email or not password:
        return Response({"status": "error", "message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if the provided CRN already exists
    if Class.objects.filter(crn=crn).exists():
        return Response({"status": "error", "error": "The provided CRN already exists! Please provide a unique CRN."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if professor exists with the provided email
    try:
        professor = Professor.objects.get(email=email)
        # If the professor exists, validate their password
        if not bcrypt.checkpw(password.encode('utf-8'), professor.hashed_password.encode('utf-8')):
            return Response({"status": "error", "error": "Invalid password provided!"}, status=status.HTTP_400_BAD_REQUEST)
    except Professor.DoesNotExist:
        # If the professor doesn't exist, insert the professor
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        professor = Professor(email=email, hashed_password=hashed_password)
        professor.save()

    # Insert the class details
    class_instance = Class(crn=crn, course_name=course_name, professor=professor)
    class_instance.save()

    return Response({"status": "success"}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def professor_login_and_generate_attendance(request):
    # Parse the data from the request
    data = request.data
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    crn = data.get("crn", "").strip()

    # Check if all fields are provided
    if not email or not password or not crn:
        return Response({"status": "error", "message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

    # Authenticate the professor
    try:
        professor = Professor.objects.get(email=email)
        if not professor_verify_password(password, professor.hashed_password):
            return Response({"status": "error", "message": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
    except Professor.DoesNotExist:
        return Response({"status": "error", "message": "Professor not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Generate attendance report
    try:
        # Ensure the CRN exists
        class_instance = Class.objects.get(crn=crn)
        
        # Find the most recent attendance date for the given CRN
        recent_date = AttendanceLog.objects.filter(class_crn=class_instance).aggregate(Max('attendance_date'))['attendance_date__max']
        
        if recent_date is None:
            return Response({"status": "error", "message": "No attendance records found for this CRN."}, status=status.HTTP_404_NOT_FOUND)

        # Fetching the attendance log for the given CRN and most recent date
        attendance_data = AttendanceLog.objects.filter(
            class_crn=class_instance, 
            attendance_date=recent_date
        ).values_list(
            'student__student_name','student__email', 'attendance_date', 'attendance_time', 'method'
        ).order_by('student__email', 'attendance_time')

        # Generate Excel file in memory
        output = io.BytesIO()
        workbook = Workbook()
        sheet = workbook.active
        headers = ['Student Name', 'Student Email', 'Attendance Date', 'Attendance Time', 'Method']
        sheet.append(headers)
        for row_data in attendance_data:
            sheet.append(list(row_data))
        
        workbook.save(output)
        output.seek(0)

        # Set up the response with the correct content type for Excel files
        response = HttpResponse(
            output, 
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{crn}_attendance_report_{recent_date}.xlsx"'

        return response

    except Class.DoesNotExist:
        return Response({"status": "error", "message": f"CRN {crn} not found"}, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

def professor_verify_password(provided_password, stored_hashed_password):
    return bcrypt.checkpw(provided_password.encode('utf-8'), stored_hashed_password.encode('utf-8'))


@api_view(['DELETE'])
def professor_delete_class(request):
    # Extract the data from the request
    crn = request.data.get('crn', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '').strip()


    # Check if all fields are provided
    if not email or not password or not crn:
        return Response({"status": "error", "message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if provided professor credentials match the database records.
    try:
        # Check if class with CRN exists and matches the provided email
        matching_class = Class.objects.filter(crn=crn, professor__email=email).first()
        if matching_class:
            stored_hashed_password = matching_class.professor.hashed_password
            if professor_verify_password(password, stored_hashed_password):
                # Perform the deletion operation within a transaction
                with transaction.atomic():
                    # Delete all students records for that CRN related Attendance System Registrations
                    AttendanceSystemRegistration.objects.filter(class_crn=matching_class).delete()
                    # Delete the class instance
                    matching_class.delete()
                
                return Response({"status": "success", "message": "Class deleted successfully"}, status=status.HTTP_200_OK)
            else:
                return Response({"status": "error", "message": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"status": "error", "message": "CRN or Email are invalid"}, status=status.HTTP_400_BAD_REQUEST)

    except Class.DoesNotExist:
        return Response({"status": "error", "message": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Handle any other exception that occurs and return an appropriate response
        return Response({"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST)