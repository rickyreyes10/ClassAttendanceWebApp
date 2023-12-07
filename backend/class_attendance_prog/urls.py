"""
URL configuration for class_attendance_prog project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from attendance.views import professor_views, student_facial_recognition_login_views, student_facial_recognition_register_views, student_qr_code_login_views, student_qr_code_register_views, student_qr_code_retrieve_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('professor/create/', professor_views.professor_create_class, name='professor-create-class'),
    path('professor/login-generate-report/', professor_views.professor_login_and_generate_attendance, name='professor-login-generate-report'),
    path('professor/delete/', professor_views.professor_delete_class, name='professor-delete-class'),
    path('student/student-facial-recognition-login/', student_facial_recognition_login_views.login_view, name='student-facial-recognition-login'),
    path('student/student-facial-recognition-register/', student_facial_recognition_register_views.register_student_view, name='student-facial-recognition-register'),
    path('student/student-qr-code-login/', student_qr_code_login_views.check_and_record_attendance, name='student-qr-code-login'),
    path('student/student-qr-code-register/', student_qr_code_register_views.submit_qr_registration, name='student-qr-code-register'),
    path('student/student-qr-code-retrieve/', student_qr_code_retrieve_views.retrieve_qr_code, name='student-qr-code-retrieve'),

]

