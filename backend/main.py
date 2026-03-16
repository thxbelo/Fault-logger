from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import os
import shutil
import asyncio
import pandas as pd
from io import BytesIO
from fastapi.responses import StreamingResponse

import models, schemas, database, auth_service, export_service, email_service

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="ISP Fault Management System")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Auth
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

# Dependency
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    from jose import JWTError, jwt
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_service.SECRET_KEY, algorithms=[auth_service.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Auth Routes
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth_service.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = auth_service.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth_service.get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, password_hash=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def _require_admin(current_user: models.User):
    if getattr(current_user, "role", None) != "Admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

def _severity_to_tier(severity: str) -> str:
    s = (severity or "").strip().lower()
    if s == "critical":
        return "CRITICAL"
    if s == "major":
        return "WARNING"
    return "INFO"

def _build_outage_email(fault: models.FaultLog) -> tuple[str, str, str]:
    tier = _severity_to_tier(fault.severity)
    subject = f"{tier}: Network Outage Detected - {fault.location} ({fault.isp_name})"
    detected = fault.created_at.strftime("%d %b %Y, %I:%M %p") if fault.created_at else "Unknown"
    body = (
        "Dear Stakeholder,\n\n"
        "BCC NIMS has automatically recorded a network disruption:\n"
        f"  Provider  : {fault.isp_name}\n"
        f"  Location  : {fault.location}\n"
        f"  Severity  : {fault.severity}\n"
        f"  Detected  : {detected}\n"
        f"  Status    : {fault.status}\n"
        f"  Ref #     : {fault.id}\n\n"
        "IT Operations has been notified and is responding.\n\n"
        "-- BCC NIMS (Automated Alert)\n"
    )
    return tier, subject, body

# Notification Rules (Upper Management Alerts)
@app.get("/notification-rules/", response_model=List[schemas.NotificationRuleOut])
def list_notification_rules(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    return db.query(models.NotificationRule).order_by(models.NotificationRule.created_at.desc()).all()

@app.post("/notification-rules/", response_model=schemas.NotificationRuleOut)
def create_notification_rule(
    rule: schemas.NotificationRuleCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    tier = (rule.tier or "").strip().upper()
    if tier not in {"INFO", "WARNING", "CRITICAL"}:
        raise HTTPException(status_code=400, detail="tier must be INFO, WARNING, or CRITICAL")
    db_rule = models.NotificationRule(tier=tier, email=rule.email, is_enabled=rule.is_enabled)
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.patch("/notification-rules/{rule_id}", response_model=schemas.NotificationRuleOut)
def update_notification_rule(
    rule_id: int,
    update_data: schemas.NotificationRuleUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    db_rule = db.query(models.NotificationRule).filter(models.NotificationRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Notification rule not found")

    data = update_data.dict(exclude_unset=True)
    if "tier" in data:
        tier = (data["tier"] or "").strip().upper()
        if tier not in {"INFO", "WARNING", "CRITICAL"}:
            raise HTTPException(status_code=400, detail="tier must be INFO, WARNING, or CRITICAL")
        data["tier"] = tier

    for k, v in data.items():
        setattr(db_rule, k, v)

    db.commit()
    db.refresh(db_rule)
    return db_rule

@app.delete("/notification-rules/{rule_id}")
def delete_notification_rule(
    rule_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    _require_admin(current_user)
    db_rule = db.query(models.NotificationRule).filter(models.NotificationRule.id == rule_id).first()
    if not db_rule:
        raise HTTPException(status_code=404, detail="Notification rule not found")
    db.delete(db_rule)
    db.commit()
    return {"message": "Notification rule deleted"}

# Fault Logs Routes
@app.post("/faults/", response_model=schemas.FaultLog)
async def create_fault(
    fault: schemas.FaultLogCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_fault = models.FaultLog(**fault.dict(exclude={'logged_by'}), logged_by=current_user.username)
    db.add(db_fault)
    db.commit()
    db.refresh(db_fault)

    # Dispatch tiered emails (configured via /notification-rules/)
    tier, subject, body = _build_outage_email(db_fault)
    recipients = [
        r.email for r in db.query(models.NotificationRule)
        .filter(models.NotificationRule.tier == tier, models.NotificationRule.is_enabled == True)  # noqa: E712
        .all()
    ]
    for recipient in recipients:
        asyncio.create_task(email_service.EmailService.send_email(subject=subject, recipient=recipient, body=body))
    
    # Broadcast new fault
    alert = {
        "event": "new_fault",
        "isp": db_fault.isp_name,
        "severity": db_fault.severity,
        "id": db_fault.id
    }
    await manager.broadcast(alert)
    return db_fault

@app.get("/faults/", response_model=List[schemas.FaultLog])
def read_faults(
    period: str = Query("all", enum=["day", "week", "month", "all"]),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.FaultLog)
    
    if period == "day":
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.FaultLog.created_at >= today)
    elif period == "week":
        week_ago = datetime.now() - timedelta(days=7)
        query = query.filter(models.FaultLog.created_at >= week_ago)
    elif period == "month":
        month_ago = datetime.now() - timedelta(days=30)
        query = query.filter(models.FaultLog.created_at >= month_ago)
        
    return query.order_by(models.FaultLog.created_at.desc()).all()

@app.patch("/faults/{fault_id}", response_model=schemas.FaultLog)
async def update_fault(
    fault_id: int, 
    update_data: schemas.FaultLogUpdate, 
    db: Session = Depends(database.get_db)
):
    db_fault = db.query(models.FaultLog).filter(models.FaultLog.id == fault_id).first()
    if not db_fault:
        raise HTTPException(status_code=404, detail="Fault not found")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(db_fault, key, value)
        if key == "status":
            if value == "Resolved":
                db_fault.resolved_at = datetime.now()
            else:
                db_fault.resolved_at = None
    
    db.commit()
    db.refresh(db_fault)
    
    if update_data.status == "Resolved":
        await manager.broadcast({"event": "fault_resolved", "id": fault_id, "isp": db_fault.isp_name})
        
    return db_fault

@app.delete("/faults/{fault_id}")
async def delete_fault(
    fault_id: int, 
    delete_data: schemas.FaultLogDelete,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify password
    if not auth_service.verify_password(delete_data.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password for deletion")
        
    db_fault = db.query(models.FaultLog).filter(models.FaultLog.id == fault_id).first()
    if not db_fault:
        raise HTTPException(status_code=404, detail="Fault not found")
        
    db.delete(db_fault)
    db.commit()
    
    await manager.broadcast({"event": "fault_deleted", "id": fault_id})
    return {"message": "Fault deleted successfully"}

# File Upload
@app.post("/upload/{fault_id}")
async def upload_document(
    fault_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db)
):
    db_fault = db.query(models.FaultLog).filter(models.FaultLog.id == fault_id).first()
    if not db_fault:
        raise HTTPException(status_code=404, detail="Fault not found")
    
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, f"{fault_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_fault.attachment_path = file_path
    db.commit()
    return {"filename": file.filename, "path": file_path}

# Reporting & Stats
@app.get("/stats/", response_model=schemas.StatsSummary)
def get_stats(db: Session = Depends(database.get_db)):
    total = db.query(models.FaultLog).count()
    open_count = db.query(models.FaultLog).filter(models.FaultLog.status == "Open").count()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)
    resolved_today = db.query(models.FaultLog).filter(models.FaultLog.status == "Resolved", models.FaultLog.resolved_at >= today).count()
    
    day_logs = db.query(models.FaultLog).filter(models.FaultLog.created_at >= today).count()
    week_logs = db.query(models.FaultLog).filter(models.FaultLog.created_at >= week_ago).count()
    month_logs = db.query(models.FaultLog).filter(models.FaultLog.created_at >= month_ago).count()
    
    # Simple SLA calc (example: resolved in < 2 hours)
    avg_res = 0.0 # Placeholder for more complex aggregation logic
    
    return {
        "total_logs": total,
        "open_issues": open_count,
        "resolved_today": resolved_today,
        "day_logs_count": day_logs,
        "week_logs_count": week_logs,
        "month_logs_count": month_logs,
        "avg_resolution_min": avg_res
    }

# Export System (Enhanced)
@app.get("/export/{format}")
def export_logs(format: str, period: str = "all", db: Session = Depends(database.get_db)):
    logs_data = read_faults(period=period, db=db)
    if format == "xlsx":
        df = pd.DataFrame([{
            "ID": l.id, "ISP": l.isp_name, "Location": l.location, 
            "Type": l.fault_type, "Severity": l.severity, "Status": l.status,
            "Created": l.created_at, "Resolved": l.resolved_at, "SLA Breach": l.is_sla_breach
        } for l in logs_data])
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Faults')
        output.seek(0)
        return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=report.xlsx"})
    
    if format == "isp-report":
        chart_data = _build_chart_data(db)
        docx_stream = export_service.ExportService.isp_report_docx(chart_data)
        return StreamingResponse(
            docx_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=ISP_Performance_Report.docx"}
        )
    
    # Fallback to existing logic for docx/pdf if needed
    raise HTTPException(status_code=400, detail="Format not fully implemented in enterprise mode yet")

# Chart Data
def _build_chart_data(db: Session) -> dict:
    """Compute per-ISP performance metrics from the DB."""
    all_isps = ["Powertel", "Starlink"]
    isp_stats = []
    for isp in all_isps:
        total = db.query(models.FaultLog).filter(models.FaultLog.isp_name == isp).count()
        resolved = db.query(models.FaultLog).filter(
            models.FaultLog.isp_name == isp,
            models.FaultLog.status == "Resolved"
        ).count()
        critical = db.query(models.FaultLog).filter(
            models.FaultLog.isp_name == isp,
            models.FaultLog.severity == "Critical"
        ).count()
        resolution_rate = (resolved / total * 100) if total > 0 else 0
        isp_stats.append({
            "name": isp,
            "total_faults": total,
            "resolved": resolved,
            "critical": critical,
            "resolution_rate": round(resolution_rate, 1)
        })
    return {"isps": isp_stats}

@app.get("/chart-data/")
def get_chart_data(db: Session = Depends(database.get_db)):
    return _build_chart_data(db)

# WebSockets
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
