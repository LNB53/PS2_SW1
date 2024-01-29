const express = require('express');
const WebSocket = require("ws");
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();


const app = express();
const myServer = app.listen(3000)
console.log("http://localhost:3000")
let quizID
let questionID
let correctAnswer

app.use(cors());
app.use(bodyParser.json());
app.use("/",express.static('public'))

const wsServer = new WebSocket.Server({
    noServer: true
})                                      // a websocket server

wsServer.on("connection", function(ws) {
    console.log('WebSocket connected');

    // Event handler for incoming messages on the WebSocket connection
    ws.on("message", function(msg) {
        console.log('Received message:', msg);

        // Parse the JSON message
        const message = JSON.parse(msg);

        // Extract quizId and questionIndex from the parsed message
        const { quizId, questionIndex} = message;
        quizID = quizId
        console.log(quizID);
        console.log(questionID);
        questionID = questionIndex
        console.log('Received quizId:', quizId, 'questionIndex:', questionIndex);

        // Broadcast the quiz and question information to all clients
        wsServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                // Send a JSON string containing quizId and questionIndex to each client
                client.send(JSON.stringify({ quizId, questionIndex }));
                console.log('Sent to client');
            }
        });
    });
});
myServer.on('upgrade', async function upgrade(request, socket, head) {      //handling upgrade(http to websockt) event

    
    
    //emit connection when request accepted
    wsServer.handleUpgrade(request, socket, head, function done(ws) {
      wsServer.emit('connection', ws, request);
    });
});

// Connect to SQLite database
const db = new sqlite3.Database('quizzes.db');

// Create tables if they don't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Quiz (
            quizID INTEGER PRIMARY KEY,
            name TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Question (
            questionID INTEGER PRIMARY KEY,
            quizID INTEGER,
            questionName TEXT,
            answerOne TEXT,
            answerTwo TEXT,
            answerThree TEXT,
            answerFour TEXT,
            correctAnswer TEXT,
            FOREIGN KEY (quizID) REFERENCES Quiz(quizID)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Score (
            ScoreID INTEGER PRIMARY KEY,
            studentID INTEGER,
            QuizID INTEGER,
            score INTEGER,
            FOREIGN KEY (studentID) REFERENCES Answer(studentID)
            FOREIGN KEY (quizID) REFERENCES Quiz(quizID)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Answer (
            answerID INTEGER PRIMARY KEY,
            answer TEXT,
            studentID INTEGER,
            questionID INTEGER,
            FOREIGN KEY (questionID) REFERENCES Question(questionID)
    )
`);
});


app.get('/api', (req, res) => {
    res.send('Hello, this is your backend server!');
});

app.get('/api/getQuizIds', (req, res) => {
    try {
        // Fetch all quiz IDs and names from the Quiz table
        db.all('SELECT quizID, name FROM Quiz', (err, quizzes) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            const quizDataArray = quizzes.map((quiz) => ({ quizId: quiz.quizID, quizName: quiz.name }));
            res.json({ quizData: quizDataArray });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/changeQuiz/:quizId', (req, res) => {
    try {
        const quizId = req.params.quizId;
        const updatedQuizData = req.body;

        // Update Quiz table
        db.run('UPDATE Quiz SET name = ? WHERE quizID = ?', [updatedQuizData.quizTitle, quizId], function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            // Delete existing questions for this quiz
            db.run('DELETE FROM Question WHERE quizID = ?', quizId, function(err) {
                if (err) {
                    res.status(500).json({ success: false, error: err.message });
                    return;
                }

                // Insert updated questions into Question table
                updatedQuizData.questions.forEach(({ question, answerOne, answerTwo, answerThree, answerFour, correctAnswer }) => {
                    db.run('INSERT INTO Question (quizID, questionName, answerOne, answerTwo, answerThree, answerFour, correctAnswer) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [quizId, question, answerOne, answerTwo, answerThree, answerFour, correctAnswer],
                        function(err) {
                            if (err) {
                                res.status(500).json({ success: false, error: err.message });
                                return;
                            }
                        }
                    );
                });

                res.json({ success: true, quizId });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/createQuiz', (req, res) => {
    try {
        const quizData = req.body;
        
        // Insert into Quiz table
        db.run('INSERT INTO Quiz (name) VALUES (?)', quizData.quizTitle, function(err) {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            const quizId = this.lastID;

            // Insert into Question table for each question
            quizData.questions.forEach(({ question, answerOne, answerTwo, answerThree, answerFour, correctAnswer }) => {
                db.run('INSERT INTO Question (quizID, questionName, answerOne, answerTwo, answerThree, answerFour, correctAnswer) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [quizId, question, answerOne, answerTwo, answerThree, answerFour, correctAnswer],
                    function(err) {
                        if (err) {
                            res.status(500).json({ success: false, error: err.message });
                            return;
                        }
                    }
                );
            });

            res.json({ success: true, quizId });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});




app.get('/api/getQuiz/:quizId', (req, res) => {
    try {
        quizId = parseInt(req.params.quizId);

        // Fetch quiz data from the database
        db.get('SELECT * FROM Quiz WHERE quizID = ?', quizId, (err, quiz) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            if (quiz) {
                // Fetch questions for the quiz from the Question table
                db.all('SELECT * FROM Question WHERE quizID = ?', quizId, (err, questions) => {
                    if (err) {
                        res.status(500).json({ success: false, error: err.message });
                        return;
                    }

                    const transformedQuestions = questions.map(({ questionName, answerOne, answerTwo, answerThree, answerFour, correctAnswer }) => {
                        const answers = [answerOne, answerTwo, answerThree, answerFour];
                        return { question: questionName, answers, correctAnswer };
                    });

                    const transformedQuiz = {
                        quizTitle: quiz.name,
                        questions: transformedQuestions,
                    };

                    res.json(transformedQuiz);
                });
            } else {
                res.status(404).json({ success: false, error: 'Quiz not found' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/getQuizData/:quizId', (req, res) => {
    try {
        const quizId = parseInt(req.params.quizId);

        // Fetch questions for the quiz from the Question table
        db.all('SELECT * FROM Question WHERE quizID = ?', quizId, (err, questions) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            res.json(questions); // Send only the questions array
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/api/getQuestionId', (req, res) => {
    try {
        
        res.json(questionID);
       
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/getScore/:student_id', (req, res) => {
    const student_id = req.params.student_id; // Corrected to extract the student_id parameter
    try {
        db.get(
            `SELECT SUM(score) as score
             FROM Score
             WHERE studentID = ?
             AND ScoreID IN (
                SELECT ScoreID
                FROM Score
                WHERE studentID = ?
                ORDER BY ScoreID DESC
                LIMIT 3
             )`,
            [student_id, student_id],
            (err, row) => {
                if (err) {
                    res.status(500).json({ success: false, error: err.message });
                    return;
                }

                // Check if the result is null (no records found) and handle accordingly
                const score = row ? row.score : 0;

                res.json(score);
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/getCorrectAnswer', (req, res) => {
    try {
        const questionId = questionID;
        
        

        // Fetch the correct answer for the given questionId
        db.get('SELECT correctAnswer, answerOne, answerTwo, answerThree, answerFour FROM Question WHERE questionID = ?', questionId, (err, row) => {
            if (err) {
                res.status(500).json({ success: false, error: err.message });
                return;
            }

            if (row) {
                const correctAnswer = row.correctAnswer;
                const answerOne = row.answerOne
                const answerTwo = row.answerTwo
                const answerThree = row.answerThree
                const answerFour = row.answerFour

                if (correctAnswer == answerOne) {
                    res.json('A');
                }
                else if (correctAnswer == answerTwo) {
                    res.json('B');
                }
                else if (correctAnswer == answerThree) {
                    res.json('C');
                }
                else if (correctAnswer == answerFour) {
                    res.json('D');
                }
            
            } else {
                res.status(404).json({ success: false, error: 'Question not found' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post(`/submit_answer/:student_id/:answer`, async (req, res) => {
    const {student_id, answer } = req.params;
    let finalAnswer = answer;
    let question_id = questionID
    let quiz_id = quizID

    console.log(`Received answer for Question ${question_id} from Student ${student_id}: ${answer}`);

    if (question_id === 0) {
        return res.status(400).json({ success: false, message: 'Invalid questionID' });
    }

    try {
        // If the answer is 'A', fetch 'answerOne' from the 'Question' table
        if (answer.toUpperCase() === 'A') {
            const row = await getAnswerOneFromDatabase(question_id);
            if (row) {
                // If 'answerOne' is found, update finalAnswer
                finalAnswer = row.answerOne;
                console.log(`Answer for Question ${question_id} changed to ${finalAnswer}`);
            }
        }
        // If the answer is 'B', fetch 'answerTwo' from the 'Question' table
        else if (answer.toUpperCase() === 'B') {
            const row = await getAnswerTwoFromDatabase(question_id);
            if (row) {
                // If 'answerTwo' is found, update finalAnswer
                finalAnswer = row.answerTwo;
                console.log(`Answer for Question ${question_id} changed to ${finalAnswer}`);
            }
        }
        else if (answer.toUpperCase() === 'C') {
            const row = await getAnswerThreeFromDatabase(question_id);
            if (row) {
                // If 'answerTwo' is found, update finalAnswer
                finalAnswer = row.answerThree;
                console.log(`Answer for Question ${question_id} changed to ${finalAnswer}`);
            }
        }
        else if (answer.toUpperCase() === 'D') {
            const row = await getAnswerFourFromDatabase(question_id);
            if (row) {
                // If 'answerTwo' is found, update finalAnswer
                finalAnswer = row.answerFour;
                console.log(`Answer for Question ${question_id} changed to ${finalAnswer}`);
            }
        }

        const answerID = this.lastID;
        await saveAnswerToDatabase(finalAnswer, student_id, question_id, quiz_id);

        res.json({ message: 'Answer received successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

function getAnswerOneFromDatabase(question_id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT answerOne FROM Question WHERE questionID = ?', [question_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function getAnswerTwoFromDatabase(question_id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT answerTwo FROM Question WHERE questionID = ?', [question_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function getAnswerThreeFromDatabase(question_id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT answerThree FROM Question WHERE questionID = ?', [question_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function getAnswerFourFromDatabase(question_id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT answerFour FROM Question WHERE questionID = ?', [question_id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function saveAnswerToDatabase(finalAnswer, student_id, question_id, quiz_id) {
    return new Promise((resolve, reject) => {
        // Insert the answer into the Answer table
        db.run('INSERT INTO Answer (answer, studentID, questionID) VALUES (?, ?, ?)',
            [finalAnswer, student_id, question_id],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                const answerID = this.lastID;

                // Calculate the score for the given answer
                calculateScore(answerID, student_id, question_id, quiz_id)
                    .then((score) => {
                        // Update the Score table with the calculated score
                        db.run('INSERT INTO Score (studentID, quizID, score) VALUES (?, ?, ?)',
                            [student_id, quiz_id, score],
                            function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            }
                        );
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        );
    });
}


function calculateScore(answerID, student_id, question_id, quiz_id) {
    return new Promise((resolve, reject) => {
        // Fetch the correct answer for the question
        db.get('SELECT correctAnswer FROM Question WHERE questionID = ?', [question_id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            correctAnswer = row.correctAnswer;

            // Fetch the submitted answer
            db.get('SELECT answer FROM Answer WHERE answerID = ?', [answerID], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                const submittedAnswer = row.answer;

                // Compare the submitted answer with the correct answer and calculate the score
                const score = submittedAnswer === correctAnswer ? 1 : 0;

                resolve(score);
            });
        });
    });
}


// Close the database connection when the server is stopped
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});
