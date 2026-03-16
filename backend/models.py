from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="Viewer") # Admin, Engineer, Viewer

class FaultLog(Base):
    __tablename__ = "fault_logs"
    id = Column(Integer, primary_key=True, index=True)
    isp_name = Column(String, index=True)
    location = Column(String)
    fault_type = Column(String)
    description = Column(Text)
    severity = Column(String) # Critical, Major, Minor
    status = Column(String, default="Open") # Open, Investigating, Resolved
    created_at = Column(DateTime, default=datetime.datetime.now)
    resolved_at = Column(DateTime, nullable=True)
    logged_by = Column(String)
    attachment_path = Column(String, nullable=True)
    is_sla_breach = Column(Boolean, default=False)

class NotificationSubscriber(Base):
    __tablename__ = "notification_subscribers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    is_enabled = Column(Boolean, default=True)

class NotificationRule(Base):
    __tablename__ = "notification_rules"
    id = Column(Integer, primary_key=True, index=True)
    tier = Column(String, index=True)  # INFO, WARNING, CRITICAL
    email = Column(String, index=True)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
