const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors());

// POST endpoint to handle answer submission
app.post('/submit_answer/:question_id/:student_id/:answer', (req, res) => {
    const { question_id, student_id, answer } = req.params;
    const answer_data = {
        question_id: question_id,
        student_id: student_id,
        answer: answer,
    };

    console.log(`Received answer for Question ${question_id} from Student ${student_id}: ${answer}`);
    console.log('Answer Data:', answer_data);

    // Assuming you want to send the answer to the frontend
    sendAnswerToFrontend(answer_data);

    // Send a response (you can customize this based on your needs)
    res.json({ message: 'Answer received successfully' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Function to send answer data to the frontend
function sendAnswerToFrontend(answerData) {
    // Replace 'http://localhost:8080/frontend.html' with the actual URL of your frontend
    const frontendURL = 'http://localhost:8080/frontend.html';

    // Send a POST request to the frontend with data
    axios.post(frontendURL, answerData)
        console.log(frontendURL)
        console.log(answerData)
        .then(response => {
            console.log('Data sent to frontend:', response.data);
        })
        .catch(error => {
            console.error('Error sending data to frontend:', error.message);
        });
}

