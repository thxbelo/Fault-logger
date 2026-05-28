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
    ticket_number = Column(String, unique=True, index=True, nullable=True)
    isp_name = Column(String, index=True)
    location = Column(String)
    fault_type = Column(String)
    description = Column(Text)
    severity = Column(String) # Critical, Major, Minor
    status = Column(String, default="Open") # Open, Assigned, Investigating, Waiting for ISP, Resolved, Closed
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, default=datetime.datetime.now, onupdate=datetime.datetime.now)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    logged_by = Column(String)
    assigned_to = Column(String, nullable=True)
    resolution_note = Column(Text, nullable=True)
    attachment_path = Column(String, nullable=True)
    is_sla_breach = Column(Boolean, default=False)

class FaultComment(Base):
    __tablename__ = "fault_comments"
    id = Column(Integer, primary_key=True, index=True)
    fault_id = Column(Integer, ForeignKey("fault_logs.id"), index=True)
    comment = Column(Text)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now)

class FaultTimeline(Base):
    __tablename__ = "fault_timeline"
    id = Column(Integer, primary_key=True, index=True)
    fault_id = Column(Integer, ForeignKey("fault_logs.id"), index=True)
    action = Column(String)
    details = Column(Text, nullable=True)
    actor = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.now)

class NotificationSubscriber(Base):
    __tablename__ = "notification_subscribers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    is_enabled = Column(Boolean, default=True)

class NotificationRule(Base):
    __tablename__ = "notification_rules"
    id = Column(Integer, primary_key=True, index=True)
    stakeholder_name = Column(String, nullable=True)
    tier = Column(String, index=True)  # INFO, WARNING, CRITICAL
    email = Column(String, index=True)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
