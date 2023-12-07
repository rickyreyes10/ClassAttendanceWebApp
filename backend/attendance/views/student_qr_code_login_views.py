from django.http import JsonResponse, HttpResponseNotAllowed
from rest_framework.decorators import api_view
from django.db import transaction
from attendance.models import Student, Class, AttendanceLog, AttendanceSystemRegistration
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def check_and_record_attendance(request):

    try:
        data = json.loads(request.body)
        email = data['email']
        crn = data['CRN']
        username = data['username']

        # Your logic to check if the student is registered
        student = Student.objects.filter(email=email).first()
        if not student:
            return JsonResponse({'error': 'Student not found.'}, status=404)

        # Ensure the class exists
        class_obj = Class.objects.filter(crn=crn).first()
        if not class_obj:
            return JsonResponse({'error': 'Class not found.'}, status=404)

        # Check if the student is registered for the class with QR code
        registration = AttendanceSystemRegistration.objects.filter(
            student=student, class_crn=class_obj, registered_for_qr=True
        ).first()
        if not registration:
            return JsonResponse({'error': 'Student not registered for this class with QR.'}, status=400)

        with transaction.atomic():
            # Your logic to record the attendance
            AttendanceLog.objects.create(
                student=student,
                student_email=email,
                class_crn=class_obj,
                attendance_date=datetime.now().date(),
                attendance_time=datetime.now().time(),
                method='QR Code'
            )

        return JsonResponse({'message': f'Welcome {student.student_name}, attendance has been marked  for CRN: {crn}!'}, status=200)

    except json.JSONDecodeError as e:
        return JsonResponse({'error': f'Error decoding JSON: {e}'}, status=400)
    except Exception as e:
        # Log the exception
        logger.exception("An error occurred when recording attendance.")
        # Return a generic error message to the client
        return JsonResponse({'error': 'An internal error occurred.'}, status=500)