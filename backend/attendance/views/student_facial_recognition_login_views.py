import datetime
from django.http import JsonResponse
from attendance.models import Student, AttendanceLog, Class, AttendanceSystemRegistration
import face_recognition
import numpy as np
from rest_framework.decorators import api_view
from io import BytesIO
import base64
import pickle


# the helper function to handle an InMemoryUploadedFile
def file_to_image(uploaded_file):
    # Read the image file into a bytes object
    img_data = uploaded_file.read()
    # Use face_recognition to load the image file directly from bytes
    return face_recognition.load_image_file(BytesIO(img_data))

# Helper function to recognize face from encoding
def recognize_from_encoding(face_encoding, crn):
    # Retrieve all students registered for the class with the given CRN
    students = Student.objects.filter(
        attendancesystemregistration__class_crn__crn=crn,
        attendancesystemregistration__registered_for_facial=True
    )
    # Iterate over the students to find a matching face encoding
    for student in students:
        registration = AttendanceSystemRegistration.objects.get(student=student, class_crn__crn=crn)
        known_face_encoding = pickle.loads(registration.facial_encoding_file)
        distance = face_recognition.face_distance([known_face_encoding], face_encoding)
        if distance < 0.6:  # Use an appropriate threshold value
            return student
    return None

# Helper function to log event
def log_event(student, class_crn):
    AttendanceLog.objects.create(
        student=student,
        student_email=student.email,
        class_crn=Class.objects.get(crn=class_crn),
        attendance_date=datetime.date.today(),
        attendance_time=datetime.datetime.now().time(),
        method='Facial Recognition'
    )

@api_view(['POST'])
def login_view(request):
    if request.method == 'POST':
        crn = request.POST.get('crn')
        image_file = request.FILES.get('image')  # Adjusted to retrieve the file
        if not crn or not image_file:
            return JsonResponse({'success': False, 'message': 'Missing CRN or image data.'})
        
        image = file_to_image(image_file)
        
        # Detect all faces and calculate face encodings
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
            # Attempt to recognize the user from the encoding of the largest face
            student = recognize_from_encoding(largest_face_encoding, crn)
            if student:
                # Log the login event
                log_event(student, crn)
                return JsonResponse({'success': True, 'message': f'Welcome back, {student.student_name}! Your attendance has been marked for CRN: {crn}.'})
            else:
                return JsonResponse({'success': False, 'message': 'Face not recognized.'})
        else:
            return JsonResponse({'success': False, 'message': 'No face found in the image.'})

    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)
