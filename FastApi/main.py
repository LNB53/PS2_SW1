import os
from fastapi import FastAPI, HTTPException, Depends, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import models
from database import engine, SessionLocal
import crud
import schemas
from sqlalchemy.orm import Session


app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello, this is your backend server!"}

@app.post("/api/createQuiz")
def create_quiz(quiz_data: schemas.QuizCreate, db: Session = Depends(get_db_session)):
    return crud.create_quiz(db, quiz_data)