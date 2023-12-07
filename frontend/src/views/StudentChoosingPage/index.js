import './StudentChoosingPage.css';
import React from 'react';
import { Link } from 'react-router-dom';

const StudentChoosing = () => {

    return (

        <div className="Student_ChoosingPage-container">

            <h1 className="Student_ChoosingPage-h1">Choose which method you want to use to take attendance for your class</h1>
            <Link to="/student-facial-recognition" style={{ textDecoration: 'none', color: 'inherit'}}>
                <button className="facial_recognition-btn">Facial Recognition</button>
            </Link>

            <Link to="/student-QR-Code" style={{ textDecoration: 'none', color: 'inherit'}}>
                <button className="qr_code-btn">Qr Code</button>
            </Link>


        </div>

        

    );


};

export default StudentChoosing;