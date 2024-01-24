const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

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

app.get('/api/getQuizData/:quizId', (req, res) => {
    try {
        const quizId = parseInt(req.params.quizId);
        const quiz = quizzes.find(q => q._id === quizId);

        if (quiz) {
            const { questions } = quiz;
            res.json(questions); // Send only the questions array
        } else {
            res.status(404).json({ success: false, error: 'Quiz not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
