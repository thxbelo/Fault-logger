import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from database import engine, Base
import models

def create_postgres_db():
    # Connect to default 'postgres' database to create the new one
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='thabelo',
            host='localhost'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Check if DB exists
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'bcc_nims'")
        exists = cur.fetchone()
        
        if not exists:
            print("Creating database 'bcc_nims'...")
            cur.execute('CREATE DATABASE bcc_nims')
        else:
            print("Database 'bcc_nims' already exists.")
            
        cur.close()
        conn.close()
        
        # Now create tables
        print("Creating tables in 'bcc_nims'...")
        Base.metadata.create_all(bind=engine)
        print("PostgreSQL Initialization Complete.")
        
    except Exception as e:
        print(f"Error during PostgreSQL init: {e}")

if __name__ == "__main__":
    create_postgres_db()
