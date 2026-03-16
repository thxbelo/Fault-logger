from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import datetime, timedelta
import random

def seed_db():
    db = SessionLocal()
    
    # Create Admin User
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        import bcrypt
        hashed = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = models.User(
            username="admin",
            email="it.admin@citybyo.org.zw",
            password_hash=hashed,
            role="Admin"
        )
        db.add(admin)
    
    # Sample BCC Data
    sites = ["City Hall", "Revenue Hall", "Engineering Dept", "Water Works", "Fire Dept HQ"]
    isps = ["Liquid Telecom", "TelOne", "Dandemutande", "Powertel"]
    fault_types = ["Fibre Cut", "Router Failure", "Internal Network Down", "ISP Maintenance"]
    
    # Add Sample Logs
    for i in range(15):
        days_ago = random.randint(0, 30)
        created = datetime.utcnow() - timedelta(days=days_ago)
        status = random.choice(["Open", "Investigating", "Resolved"])
        resolved = created + timedelta(hours=random.randint(1, 4)) if status == "Resolved" else None
        
        fault = models.FaultLog(
            isp_name=random.choice(isps),
            location=random.choice(sites),
            fault_type=random.choice(fault_types),
            severity=random.choice(["Minor", "Major", "Critical"]),
            description="Council service interruption reported at site.",
            status=status,
            logged_by="admin",
            created_at=created,
            resolved_at=resolved,
            is_sla_breach=False
        )
        db.add(fault)
        
    db.commit()
    db.close()
    print("BCC NIMS Database Seeded Successfully.")

if __name__ == "__main__":
    seed_db()
