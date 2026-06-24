from database import SessionLocal, engine
from models import Base, User, Conversation, ConversationMember, Message

Base.metadata.create_all(bind=engine)

db = SessionLocal()

db.query(Message).delete()
db.query(ConversationMember).delete()
db.query(Conversation).delete()
db.query(User).delete()

users = [
    User(username="sankalp", phone="9999999999", display_name="Sankalp", avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Sankalp", is_online=True),
    User(username="alice", phone="8888888888", display_name="Alice", avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Alice", is_online=True),
    User(username="bob", phone="7777777777", display_name="Bob", avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Bob", is_online=False),
    User(username="neha", phone="6666666666", display_name="Neha", avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Neha", is_online=True),
    User(username="rahul", phone="5555555555", display_name="Rahul", avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Rahul", is_online=False),
]

db.add_all(users)
db.commit()

for user in users:
    db.refresh(user)

direct1 = Conversation(type="direct")
direct2 = Conversation(type="direct")
group1 = Conversation(type="group", name="Interview Prep Group", avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=Interview")

db.add_all([direct1, direct2, group1])
db.commit()

db.refresh(direct1)
db.refresh(direct2)
db.refresh(group1)

members = [
    ConversationMember(conversation_id=direct1.id, user_id=users[0].id, role="member", unread_count=0),
    ConversationMember(conversation_id=direct1.id, user_id=users[1].id, role="member", unread_count=2),

    ConversationMember(conversation_id=direct2.id, user_id=users[0].id, role="member", unread_count=1),
    ConversationMember(conversation_id=direct2.id, user_id=users[2].id, role="member", unread_count=0),

    ConversationMember(conversation_id=group1.id, user_id=users[0].id, role="admin", unread_count=3),
    ConversationMember(conversation_id=group1.id, user_id=users[1].id, role="member", unread_count=0),
    ConversationMember(conversation_id=group1.id, user_id=users[2].id, role="member", unread_count=0),
    ConversationMember(conversation_id=group1.id, user_id=users[3].id, role="member", unread_count=0),
]

db.add_all(members)
db.commit()

messages = [
    Message(conversation_id=direct1.id, sender_id=users[1].id, content="Hey Sankalp, are you working on the assignment?", status="read", is_read=True),
    Message(conversation_id=direct1.id, sender_id=users[0].id, content="Yes, building the Signal clone now.", status="read", is_read=True),
    Message(conversation_id=direct1.id, sender_id=users[1].id, content="Nice, realtime chat will look impressive.", status="delivered"),

    Message(conversation_id=direct2.id, sender_id=users[2].id, content="Did you finish the backend setup?", status="delivered"),
    Message(conversation_id=direct2.id, sender_id=users[0].id, content="Almost done. Database is ready.", status="sent"),

    Message(conversation_id=group1.id, sender_id=users[3].id, content="Let's revise system design tonight.", status="read", is_read=True),
    Message(conversation_id=group1.id, sender_id=users[1].id, content="Sure, we can cover WebSockets and database schema.", status="read", is_read=True),
    Message(conversation_id=group1.id, sender_id=users[0].id, content="Perfect. This project itself is good practice.", status="sent"),
]

db.add_all(messages)
db.commit()

db.close()

print("Database seeded successfully!")