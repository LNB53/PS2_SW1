from typing import List
from pydantic import BaseModel

class QuizBase(BaseModel):
    quizTitle: str

class QuizCreate(QuizBase):
    questions: list[questions] = []

class Quiz(QuizBase):
    quizID: int

    class Config:
        orm_mode = True

class QuestionBase(BaseModel):
    quizID: int
    questionName: str
    answerOne: str
    answerTwo: str
    answerThree: str
    answerFour: str
    correctAnswer: str

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    questionID: int

    class Config:
        orm_mode = True

class ScoreBase(BaseModel):
    studentID: int
    quizID: int
    score: int

class ScoreCreate(ScoreBase):
    pass

class Score(ScoreBase):
    scoreID: int

    class Config:
        orm_mode = True

class AnswerBase(BaseModel):
    answer: str
    studentID: int
    questionID: int

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    answerID: int

    class Config:
        orm_mode = True