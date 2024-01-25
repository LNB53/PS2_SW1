from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Quiz(Base):
    __tablename__ = "quiz"

    quizID = Column(Integer, primary_key=True, index=True)
    name = Column(String)

class Question(Base):
    __tablename__ = "question"

    questionID = Column(Integer, primary_key=True, index=True)
    quizID = Column(Integer, ForeignKey("quiz.quizID"))
    questionName = Column(String)
    answerOne = Column(String)
    answerTwo = Column(String)
    answerThree = Column(String)
    answerFour = Column(String)
    correctAnswer = Column(String)

class Score(Base):
    __tablename__ = "score"

    scoreID = Column(Integer, primary_key=True, index=True)
    studentID = Column(Integer, ForeignKey("answer.studentID"))
    quizID = Column(Integer, ForeignKey("quiz.quizID"))
    score = Column(Integer)


class Answer(Base):
    __tablename__ = "answer"

    answerID = Column(Integer, primary_key=True, index=True)
    answer = Column(String)
    studentID = Column(Integer)
    questionID = Column(Integer, ForeignKey("question.questionID"))
