from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "Viewer"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FaultLogBase(BaseModel):
    isp_name: str
    location: str
    fault_type: str
    description: str
    severity: str
    assigned_to: Optional[str] = None
    logged_by: Optional[str] = None

class FaultLogCreate(FaultLogBase):
    pass

class FaultLogUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution_note: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    is_sla_breach: Optional[bool] = None

class FaultLog(FaultLogBase):
    id: int
    ticket_number: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    attachment_path: Optional[str] = None
    resolution_note: Optional[str] = None
    is_sla_breach: bool

    class Config:
        from_attributes = True

class FaultCommentCreate(BaseModel):
    comment: str

class FaultCommentOut(BaseModel):
    id: int
    fault_id: int
    comment: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class FaultTimelineOut(BaseModel):
    id: int
    fault_id: int
    action: str
    details: Optional[str] = None
    actor: str
    created_at: datetime

    class Config:
        from_attributes = True

class FaultLogDelete(BaseModel):
    password: str

class StatsSummary(BaseModel):
    total_logs: int
    open_issues: int
    active_faults: int
    critical_incidents: int
    resolved_today: int
    day_logs_count: int
    week_logs_count: int
    month_logs_count: int
    avg_resolution_min: float
    most_affected_isp: Optional[str] = None
    latest_ticket: Optional[str] = None
    latest_location: Optional[str] = None

class NotificationRuleBase(BaseModel):
    stakeholder_name: Optional[str] = None
    tier: str  # INFO, WARNING, CRITICAL
    email: EmailStr
    is_enabled: bool = True

class NotificationRuleCreate(NotificationRuleBase):
    pass

class NotificationRuleUpdate(BaseModel):
    stakeholder_name: Optional[str] = None
    tier: Optional[str] = None
    email: Optional[EmailStr] = None
    is_enabled: Optional[bool] = None

class NotificationRuleOut(NotificationRuleBase):
    id: int

    class Config:
        from_attributes = True

class SpeedTestResult(BaseModel):
    download: float
    upload: float
    ping: float
    server: str
    timestamp: datetime
