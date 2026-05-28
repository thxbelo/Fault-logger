from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from datetime import datetime, timedelta
import random
import os
import secrets

def seed_db():
    db = SessionLocal()
    
    # Create Admin User
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        import bcrypt
        seed_password = os.getenv("SEED_ADMIN_PASSWORD") or secrets.token_urlsafe(12)
        hashed = bcrypt.hashpw(seed_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = models.User(
            username="admin",
            email="it.admin@citybyo.org.zw",
            password_hash=hashed,
            role="Admin"
        )
        db.add(admin)
        print(f"Seed admin created. Username: admin Password: {seed_password}")
    
    # Sample BCC Data
    sites = ["City Hall", "Revenue Hall", "Engineering Dept", "Water Works", "Fire Dept HQ"]
    isps = ["Liquid Telecom", "TelOne", "Dandemutande", "Powertel"]
    fault_types = ["Fibre Cut", "Router Failure", "Internal Network Down", "ISP Maintenance"]
    existing_fault_count = db.query(models.FaultLog).count()
    
    # Add Sample Logs
    for i in range(15):
        days_ago = random.randint(0, 30)
        created = datetime.utcnow() - timedelta(days=days_ago)
        status = random.choice(["Open", "Investigating", "Resolved"])
        resolved = created + timedelta(hours=random.randint(1, 4)) if status == "Resolved" else None
        
        fault = models.FaultLog(
            ticket_number=f"BCC-NET-{created.year}-{existing_fault_count + i + 1:04d}",
            isp_name=random.choice(isps),
            location=random.choice(sites),
            fault_type=random.choice(fault_types),
            severity=random.choice(["Minor", "Major", "Critical"]),
            description="Council service interruption reported at site.",
            status=status,
            logged_by="admin",
            created_at=created,
            updated_at=created,
            resolved_at=resolved,
            resolution_note="Service restored by provider." if status == "Resolved" else None,
            is_sla_breach=False
        )
        db.add(fault)
        
    db.commit()
    db.close()
    print("BCC NIMS Database Seeded Successfully.")

if __name__ == "__main__":
    seed_db()
