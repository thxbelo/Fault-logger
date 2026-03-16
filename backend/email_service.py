import aiosmtplib
from email.message import EmailMessage
import os

class EmailService:
    @staticmethod
    async def send_email(subject: str, recipient: str, body: str, attachment: bytes = None, filename: str = None):
        # In a real scenario, use environment variables for these
        SMTP_SERVER = os.getenv("SMTP_SERVER", "localhost")
        SMTP_PORT = int(os.getenv("SMTP_PORT", 1025))
        SMTP_USER = os.getenv("SMTP_USER", "")
        SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

        message = EmailMessage()
        message["From"] = "system@faultlogger.com"
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)

        if attachment and filename:
            maintype, subtype = "application", "octet-stream"
            if filename.endswith(".docx"):
                subtype = "vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif filename.endswith(".pdf"):
                subtype = "pdf"
            elif filename.endswith(".xlsx"):
                subtype = "vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
            message.add_attachment(
                attachment,
                maintype=maintype,
                subtype=subtype,
                filename=filename
            )

        try:
            # For testing, we'll just log if skip_send is true or if server isn't configured
            if not SMTP_USER and SMTP_SERVER == "localhost":
                print(f"MOCK EMAIL to {recipient}: {subject}")
                return True

            await aiosmtplib.send(
                message,
                hostname=SMTP_SERVER,
                port=SMTP_PORT,
                username=SMTP_USER,
                password=SMTP_PASSWORD,
                use_tls=True if SMTP_PORT == 465 else False
            )
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
