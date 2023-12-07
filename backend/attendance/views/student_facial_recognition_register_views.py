from attendance.models import Student, AttendanceSystemRegistration, Class
import face_recognition
import pickle
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

@api_view(['POST'])
def register_student_view(request):
    if request.method == 'POST':
        username = request.POST['username'].strip()
        email = request.POST['email'].strip()
        crn = request.POST['crn'].strip()

        if not email or not username or not crn:
            return JsonResponse({'success': False, 'message': 'Username, email, and CRN cannot be empty'})

        image_file = request.FILES.get('image')
        if not image_file:
            return JsonResponse({'success': False, 'message': 'Image file is missing.'})

        # Process image file to get facial encodings
        image = face_recognition.load_image_file(image_file)
        face_locations = face_recognition.face_locations(image)
        face_encodings = face_recognition.face_encodings(image, face_locations)

        # Find the largest face detected
        largest_face_encoding = None
        largest_area = 0
        for face_location, face_encoding in zip(face_locations, face_encodings):
            top, right, bottom, left = face_location
            area = (bottom - top) * (right - left)
            if area > largest_area:
                largest_area = area
                largest_face_encoding = face_encoding

        # Proceed only if a face was found
        if largest_face_encoding is not None:
            serialized_encoding = pickle.dumps(largest_face_encoding)

            try:
                with transaction.atomic():
                    # Check if a student with the given email already exists
                    student, _ = Student.objects.get_or_create(email=email, defaults={'student_name': username})

                    # Attempt to get an existing registration
                    registration_qs = AttendanceSystemRegistration.objects.filter(student=student, class_crn__crn=crn)
                    
                    # If a registration already exists, check if it has facial encoding file
                    if registration_qs.exists():
                        registration = registration_qs.first()
                        if registration.registered_for_facial:
                            return JsonResponse({'success': False, 'message': f'You are already registered for facial recognition for CRN: {crn}. Please log in.'})
                        else:
                            # The registration exists but has no facial data, so update the regristration record with the facial encoding file and other things
                            # meaning that the student has used qr code system to take attendance for the specific CRN in the past... so we just update that existing record
                            registration.facial_encoding_file = serialized_encoding
                            registration.registered_for_facial = True
                            registration.save()
                            return JsonResponse({'success': True, 'message': f'Your facial encodings have been updated for CRN: {crn}.'})
                    else:
                        # No registration exists, create a new regristration record for this student for the specified CRN
                        class_obj = Class.objects.get(crn=crn)  # This line can raise Class.DoesNotExist
                        registration = AttendanceSystemRegistration.objects.create(
                            student=student, 
                            class_crn=class_obj,
                            facial_encoding_file=serialized_encoding,
                            registered_for_facial=True,
                            registered_for_qr=False
                        )
                        return JsonResponse({'success': True, 'message': f'{username} was successfully registered for the facial recognition system for CRN: {crn}.'})

            except Class.DoesNotExist:
                return JsonResponse({'success': False, 'message': f'CRN {crn} not found.'})
            
            except Exception as e:
                return JsonResponse({'success': False, 'message': 'An error occurred during the registration process.'})

        else:
            return JsonResponse({'success': False, 'message': 'No face found. Try again.'})

    else:
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
