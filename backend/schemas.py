from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: str = "Viewer"

class UserCreate(UserBase):
    password: str

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
    logged_by: Optional[str] = None

class FaultLogCreate(FaultLogBase):
    pass

class FaultLogUpdate(BaseModel):
    status: Optional[str] = None
    resolved_at: Optional[datetime] = None
    is_sla_breach: Optional[bool] = None

class FaultLog(FaultLogBase):
    id: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    attachment_path: Optional[str] = None
    is_sla_breach: bool

    class Config:
        from_attributes = True

class FaultLogDelete(BaseModel):
    password: str

class StatsSummary(BaseModel):
    total_logs: int
    open_issues: int
    resolved_today: int
    day_logs_count: int
    week_logs_count: int
    month_logs_count: int
    avg_resolution_min: float

class NotificationRuleBase(BaseModel):
    tier: str  # INFO, WARNING, CRITICAL
    email: EmailStr
    is_enabled: bool = True

class NotificationRuleCreate(NotificationRuleBase):
    pass

class NotificationRuleUpdate(BaseModel):
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
