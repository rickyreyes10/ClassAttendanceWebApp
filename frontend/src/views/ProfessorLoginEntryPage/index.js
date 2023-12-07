import './ProfessorLoginEntry.css';
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ProfessorLogin = () => {

    // Initializing formData state
    const [formData, setFormData] = useState({
        crn: '',
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false); //State for toggling password visibility

    
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    //form handling
    const handleSubmit = () => {
        if (!formData.email || !formData.password || !formData.crn) {
            toast.error('Please fill in all fields.');
            return;
        }

        // Use the formData directly as the JSON payload
        const formPayload = JSON.stringify(formData);
    
        console.log(formData);

        // Function to get the CSRF token from cookies
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

        // Get the CSRF token
        const csrftoken = getCookie('csrftoken');
    
        // Make an API call to the backend with formData
        fetch('http://127.0.0.1:8000/professor/login-generate-report/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken, // Include the CSRF token here
            },
            body: formPayload
        })
        .then(response => {
            if (!response.ok) {
                // If the response is not OK, throw an error
                return response.json().then(data => {
                    throw new Error(data.message);
                });
            }
            // Check the content type of the response
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") !== -1) {
                // If the response is a file, return the Blob promise
                return response.blob();
            } else if (contentType && contentType.indexOf("application/json") !== -1) {
                // If the response is JSON, return the JSON promise
                return response.json();
            }
            throw new Error('Unexpected response type');
        })
        .then(data => {
            if (data instanceof Blob) {
                // Handle the Blob data (file download)
                const url = window.URL.createObjectURL(data);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'attendance_report.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                toast.success('Attendance report generated successfully!');
            } else {
                // Handle JSON data (error message)
                toast.error(data.message);
            }
        })
        .catch(error => {
            console.error("There was an error processing the request:", error);
            toast.error(error.message || 'There was an error processing your request.');
        });
    };
    return (
        <div className="prof-login-container">
            <h1 className="prof-login-h1">Professor Login</h1>
            {/* ... (rest of the form elements remain unchanged) ... */}
            
            <h2 className="prof-login-h2">CRN</h2>
            <div className="prof-login-input-container">
                <input 
                    className="prof-login-input" 
                    type="text" 
                    placeholder="Enter CRN..." 
                    name="crn" 
                    value={formData.crn} 
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>

            <h2 className="prof-login-h2">Email</h2>
            <div className="prof-login-input-container">
                <input 
                    className="prof-login-input" 
                    type="email" 
                    placeholder="Enter Email..." 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    autoComplete="email"
                />
            </div>

            <h2 className="prof-login-h2">Password</h2>
<           div className="prof-login-input-container">
                <input 
                    className="prof-login-input" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter Password..." 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange}
                    autoComplete="current-password"
                />

                <i 
                    className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password-icon`} 
                    onClick={() => setShowPassword(prevShowPassword => !prevShowPassword)}
                ></i>
            </div>

            <ToastContainer position={toast.POSITION.TOP_RIGHT}/>
            
            <button className="loginEntry-btn" onClick={handleSubmit}>Generate Report</button>
        </div>
    );
}

export default ProfessorLogin;