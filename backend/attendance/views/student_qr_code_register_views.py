from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.db import transaction
from attendance.models import Student, Class, AttendanceSystemRegistration
import qrcode
from io import BytesIO
import json
import base64

@api_view(['POST'])
def submit_qr_registration(request):
    # Assume data is sent as a JSON object in the body of a POST request
    data = json.loads(request.body)
    username = data['username']
    email = data['email']
    crn = data['crn']

    try:
        with transaction.atomic():
            # Check if a student with the given email already exists
            student, _ = Student.objects.get_or_create(email=email, defaults={'student_name': username})

            # Attempt to get an existing registration
            registration_qs = AttendanceSystemRegistration.objects.filter(student=student, class_crn__crn=crn)
            
            # If a registration already exists, check if it has a QR code file
            if registration_qs.exists():
                registration = registration_qs.first()
                if registration.registered_for_qr:
                    return JsonResponse({'success': False, 'message': f'You are already registered for QR code attendance for CRN: {crn}. Please log in.'})
                else:
                    # The registration exists but has no QR code data, so update the registration record with the QR code file
                    qr_code_binary = generate_qr_code(username, email, crn)
                    registration.qr_code_file = qr_code_binary
                    registration.registered_for_qr = True
                    registration.save()
                    # Convert binary QR code to base64 to send to the frontend
                    qr_code_base64 = base64.b64encode(qr_code_binary).decode('utf-8')
                    return JsonResponse({'success': True, 'qr_code': qr_code_base64})
            else:
                # No registration exists, create a new registration record for this student for the specified CRN
                class_obj = Class.objects.get(crn=crn)  # This line can raise Class.DoesNotExist
                qr_code_binary = generate_qr_code(username, email, crn)
                AttendanceSystemRegistration.objects.create(
                    student=student, 
                    class_crn=class_obj,
                    qr_code_file=qr_code_binary,
                    registered_for_qr=True,
                    registered_for_facial=False  # Assuming this is new registration not facial recognition
                )

                # Convert binary QR code to base64 to send to the frontend
                qr_code_base64 = base64.b64encode(qr_code_binary).decode('utf-8')
                return JsonResponse({'success': True, 'qr_code': qr_code_base64})

    except Class.DoesNotExist:
        return JsonResponse({'success': False, 'message': f'CRN {crn} not found.'})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON data provided.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


def generate_qr_code(username, email, crn):
    # Create QR code data as a dictionary
    qr_data = {"username": username, "email": email, "CRN": crn}
    # Convert QR code data to a JSON string
    json_str = json.dumps(qr_data)
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(json_str)
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')
    # Save QR code as binary
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()