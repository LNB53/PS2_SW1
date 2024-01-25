from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./quizzes.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, echo=True, connect_args={"check_same_thread": False}
)

# sessie voor db
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# verbinding naar db, ref naar base
Base = declarative_base()