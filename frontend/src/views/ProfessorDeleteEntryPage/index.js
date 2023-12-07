import './ProfessorDelete.css';
import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom'; // Assuming you might use routing at some point

const ProfessorDelete = () => {

    // Initializing formData state
    const [formData, setFormData] = useState({
        crn: '',
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false); //State for toggling password visibility

    // handling user input
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        if (!formData.crn || !formData.email || !formData.password){
            toast.error('Please fill in all fields.');
            return;
        }

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

        // Use the formData directly as the JSON payload
        const formPayload = JSON.stringify(formData);

        console.log(formData);
        // Make an API call to the backend with formData
        fetch('http://127.0.0.1:8000/professor/delete/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken, // Include the CSRF token here
            },
            body: formPayload
        })
        .then(response => response.json())
        .then(data => {
            if(data.status === "success") {
                // Handle the success scenario
                // For instance, you can display a success notification or redirect to another page
                toast.success('Class was deleted successfully!');
            } else if(data.status === "error") {
                // Handle the error scenario
                // Display the error message to the user
                toast.error(data.message);
            }
        })
        .catch(error => {
            // Handle any other network or parsing errors here
            console.error("There was an error processing the request:", error);
        });
    };

    return (
        <div className="prof-delete-container">
            <h1 className="prof-delete-h1">Professor Delete</h1>

            <h2 className="prof-delete-h2">CRN</h2>
            <div className="prof-delete-input-container">
                <input 
                    className="prof-delete-input" 
                    type="text" 
                    placeholder="Enter CRN..." 
                    name="crn" 
                    value={formData.crn} 
                    onChange={handleChange}
                    autoComplete="off"
                />
            </div>

            <h2 className="prof-delete-h2">Email</h2>
            <div className="prof-delete-input-container">
                <input 
                    className="prof-delete-input" 
                    type="email" 
                    placeholder="Enter Email..." 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    autoComplete="email"
                />
            </div>

            <h2 className="prof-delete-h2">Password</h2>
<           div className="prof-delete-input-container">
                <input 
                    className="prof-delete-input" 
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

            <ToastContainer position={toast.POSITION.TOP_RIGHT }/>

            <button className="deleteEntry-btn" onClick={handleSubmit}>Delete</button>
        </div>
    );
}

export default ProfessorDelete;