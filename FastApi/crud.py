from fastapi import HTTPException
from sqlalchemy.orm import Session
import database
import models
import schemas

def create_quiz(db: Session, quiz_data: schemas.QuizCreate):
    try:
        with db.begin():
            # Create the quiz
            quiz = models.Quiz(name=quiz_data.quizTitle)
            db.add(quiz)
            db.flush()

            # Create the questions for the quiz
            for q in quiz_data.questions:
                question = models.Question(
                    quizID=quiz.id,
                    questionName=q.question,
                    answerOne=q.answerOne,
                    answerTwo=q.answerTwo,
                    answerThree=q.answerThree,
                    answerFour=q.answerFour,
                    correctAnswer=q.correctAnswer,
                )
                db.add(question)

            db.commit()

            return {"success": True, "quizId": quiz.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))