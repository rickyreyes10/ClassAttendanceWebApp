from django.http import JsonResponse, HttpResponseNotAllowed
from rest_framework.decorators import api_view
from attendance.models import Student, Class, AttendanceSystemRegistration
import json
import base64

@api_view(['POST'])
def retrieve_qr_code(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])

    try:
        data = json.loads(request.body)
        username = data['username']
        email = data['email']
        crn = data['crn']  # Include crn in the data received

        # Lookup the student and class by email, student_name (username), and crn
        student = Student.objects.filter(email=email, student_name=username).first()
        class_obj = Class.objects.filter(crn=crn).first()  # Lookup the class using crn

        if not student or not class_obj:
            return JsonResponse({'success': False, 'message': 'Student or class not found.'}, status=404)

        # Lookup the registration record for the student and class
        registration = AttendanceSystemRegistration.objects.filter(
            student=student, class_crn=class_obj, registered_for_qr=True
        ).first()
        if not registration or not registration.qr_code_file:
            return JsonResponse({'success': False, 'message': 'QR code not found or not registered for this class.'}, status=404)

        # Convert the binary QR code data to base64
        qr_code_base64 = base64.b64encode(registration.qr_code_file).decode('utf-8')
        return JsonResponse({'success': True, 'qr_code': qr_code_base64}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data provided.'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)