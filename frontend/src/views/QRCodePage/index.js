import './QRCodePage.css';
import Modal from 'react-modal';
import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5QrcodeScanner } from "html5-qrcode";

Modal.setAppElement('#root');

const QRCodePage = () => {
  const [crn, setCrn] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState(null); // State to hold the QR code image URL
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const qrScannerRef = useRef(null);


  useEffect(() => {
    
    // This function will be called every time a QR code is scanned.
    const onScanSuccess = async (decodedText, decodedResult) => {
      // Stop scanning QR codes once we have a successful scan
      qrScannerRef.current.clear(); // Use clear() to stop scanning

      try {
        // Parse the QR code text to JSON
        const data = JSON.parse(decodedText);

        // Send the data to the backend for verification and to mark attendance
        const response = await fetch('http://127.0.0.1:8000/student/student-qr-code-login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to record attendance');
        }

        const result = await response.json();
        toast.success(result.message);
      } catch (e) {
        toast.error(`Error: ${e.message}`);
      } finally {
        // Optionally, if you want to restart scanning after an error
        // qrScannerRef.current.start();
      }
    };

    // Define the configuration for the QR scanner
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    // Create a new instance of the Html5QrcodeScanner
    const html5QrCodeScanner = new Html5QrcodeScanner("qr-reader", config, false);
    qrScannerRef.current = html5QrCodeScanner;

    // Render the QR scanner component with the onScanSuccess callback
    html5QrCodeScanner.render(onScanSuccess);

    // Cleanup function to stop the scanner when the component is unmounted
    return () => {
      qrScannerRef.current.clear();
    };
  }, []); // Empty dependency array means this effect will only run on mount and unmount


  const handleRegisterSubmit = async () => {
    if (!crn || !username || !email) {
      toast.error('Please fill out all fields.');
      return;
    }
    
    try {
      const response = await fetch('http://127.0.0.1:8000/student/student-qr-code-register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crn, username, email }),
      });

      const result = await response.json();
      if (result.success) {
          const qrCodeImageUrl = `data:image/png;base64,${result.qr_code}`;
          setQrCodeImage(qrCodeImageUrl);
          setIsRegistering(false);
          toast.success(result.message);
      } else {
          throw new Error(result.message);
      }
    } catch (error) {
        toast.error(`Registration failed: ${error.message}`);
    }
  };


  const handleRetrieveSubmit = async () => {
    // Implementation for QR code retrieval submission
    if(!crn || !username || !email) {
      toast.error('Please fill out all fields');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/student/student-qr-code-retrieve/', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({crn, username, email})
      });

      const result = await response.json();
      if (result.success) {
        const qrCodeImageUrl = `data:image/png;base64,${result.qr_code}`;
        setQrCodeImage(qrCodeImageUrl);
        toast.success(result.message);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(`Retrieval failed: ${error.message}`);
    }

  };

  const handleRegister = () => {
    setModalIsOpen(true);
    setIsRegistering(true);
  };

  const handleRetrieve = () => {
    setModalIsOpen(true);
    setIsRegistering(false);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setIsRegistering(false); // Reset the modal state
    setQrCodeImage(null); // Clear the QR code image
  };

  return (
    <div className="QR_Code-page-container">
      <h1 className="QR_Code-page-h1">QR Code</h1>
      <div id="qr-reader" style={{ width: '100%' }}></div>
      <button className="QR_Code-register-btn" onClick={handleRegister}>
        Register
      </button>
      <button className="QR_Code-retrieve-btn" onClick={handleRetrieve}>
        Retrieve QR Code
      </button>
      <ToastContainer position="top-right" />
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Credentials Modal"
        className="Modal"
        overlayClassName="Overlay"
      >
        {
          isRegistering ? (
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
          ) : qrCodeImage ? (
            // Show QR Code after successful registration
            <>
              <h2>Your QR Code</h2>
              <p>Use your camera to take a picture of the QR code or take a screenshot of your dispaly for future logins and attendance marking.</p>
              <div className="qr-code-image-container">
                <img src={qrCodeImage} alt="QR Code" />
              </div>
              <button onClick={closeModal}>Close</button>
            </>
          ) : (
            // Retrieve QR code form
            <>
              <h2>Retrieve Your QR Code</h2>
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
              <button onClick={handleRetrieveSubmit}>Retrieve QR Code</button>
            </>
          )
        }
      </Modal>
    </div>
  );
};

export default QRCodePage;