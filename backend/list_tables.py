from sqlalchemy import create_engine, inspect
import os

# Load credentials from the .env file (make sure python-dotenv is installed)
from dotenv import load_dotenv
load_dotenv('.env')

# Build the SQLAlchemy engine using the DATABASE_URL env variable
engine = create_engine(os.getenv('DATABASE_URL'))
inspector = inspect(engine)

print('Tables in database:')
for table_name in inspector.get_table_names():
    print(f'- {table_name}')
