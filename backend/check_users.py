from database import SessionLocal
from models import User

db = SessionLocal()

users = db.query(User).all()

for user in users:
    print(
        user.id,
        user.username,
        user.display_name
    )

db.close()