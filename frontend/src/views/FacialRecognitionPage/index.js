import './FacialRecognitionPage.css';
import Modal from 'react-modal';
import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root'); //supresses modal-related console warnings.

const FacialRecognitionPage = () => {
  const [crn, setCrn] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const videoRef = useRef(null);
  useEffect(() => {
    let stream = null;

    // This function initializes the webcam stream.
    const getVideo = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      } catch (err) {
        console.error("error:", err);
      }
    };

    getVideo();

    // Cleanup function
    return () => {
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => {
          track.stop();
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [videoRef]);

  

  // Function to capture image data from the webcam
  const captureImageData = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg');
    });
  };


  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  };


  const handleLoginSubmit = async () => {
    const imageData = await captureImageData();
    // Create a FormData object to send the CRN and image data
    const formData = new FormData();
    formData.append('crn', crn);
    formData.append('image', imageData);
    // Append the CSRF token retrieved from the cookies to the form data
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
  
    try {
      const response = await fetch('http://127.0.0.1:8000/student/student-facial-recognition-login/', { // Replace with your actual backend API endpoint
        method: 'POST',
        body: formData,
        credentials: 'include', //necessary for cookies to be sent with the request
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        // Handle successful login, e.g., redirecting the user
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login.');
    }
    setModalIsOpen(false);
  };
     //  student/student-facial-recognition-register/

  const handleRegisterSubmit = async () => {
    const imageData = await captureImageData();
    // Create a FormData object to send the CRN, email, username, and image data
    const formData = new FormData();
    formData.append('crn', crn);
    formData.append('email', email);
    formData.append('username', username);
    formData.append('image', imageData);
    formData.append('csrfmiddlewaretoken', getCookie('csrftoken'));
  
    try {
      const response = await fetch('http://127.0.0.1:8000/student/student-facial-recognition-register/', { // Replace with your actual backend API endpoint    
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        // Handle successful registration, e.g., redirecting the user
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration.');
    }
    setModalIsOpen(false);
  };


  const handleLogin = () => {
    setModalIsOpen(true);
    setIsRegistering(false);
  };


  const handleRegister = () => {
    setModalIsOpen(true);
    setIsRegistering(true);
  };



  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className="facial_recognition-page-container">
      <h1 className="facial_recognition-page-h1">Facial Recognition</h1>
      <div className="fr-webcam-container">
        <video ref={videoRef} style={{ width: '100%' }} />
      </div>
      <button className="facial_recognition-login-btn" onClick={handleLogin}>
        Login
      </button>
      <button className="facial_recognition-register-btn" onClick={handleRegister}>
        Register
      </button>
      <ToastContainer position="top-right" />
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Credentials Modal"
        className="Modal"
        overlayClassName="Overlay"
      >
        {isRegistering ? (
          <>
            <h2>Register</h2>
            <input 
              type="text"
              placeholder="Enter CRN..."
              value={crn}
              onChange={(e) => setCrn(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="email"
              placeholder="Enter Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={handleRegisterSubmit}>Submit Registration</button>
          </>
        ) : (
          <>
            <h2>Login</h2>
            <input 
              type="text"
              placeholder="Enter CRN..."
              value={crn}
              onChange={(e) => setCrn(e.target.value)}
            />
            <button onClick={handleLoginSubmit}>Submit Login</button>
          </>
        )}
      </Modal>
    </div>
  );
};

export default FacialRecognitionPage;