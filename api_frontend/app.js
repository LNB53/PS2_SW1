const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

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
        CREATE TABLE IF NOT EXISTS Answer (
            answerID INTEGER PRIMARY KEY,
            answer TEXT,
            studentID INTEGER,
            questionID INTEGER,
            FOREIGN KEY (questionID) REFERENCES Question(questionID)
    )
`);
});


app.get('/', (req, res) => {
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
        const quizId = parseInt(req.params.quizId);

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

app.post('/submit_answer/:question_id/:student_id/:answer', async (req, res) => {
    const { question_id, student_id, answer } = req.params;
    let finalAnswer = answer;

    console.log(`Received answer for Question ${question_id} from Student ${student_id}: ${answer}`);

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
        await saveAnswerToDatabase(finalAnswer, student_id, question_id);

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

function saveAnswerToDatabase(finalAnswer, student_id, question_id) {
    return new Promise((resolve, reject) => {
        const answerID = this.lastID;
        db.run('INSERT INTO Answer (answerID, answer, studentID, questionID) VALUES (?, ?, ?, ?)',
            [answerID, finalAnswer, student_id, question_id],
            function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}





// Close the database connection when the server is stopped
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
