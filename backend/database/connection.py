import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any, List
from contextlib import contextmanager

# Read backend/.env if available
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
if os.path.exists(ENV_PATH):
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

# Default configuration - can be overridden via environment variables or .env
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "horizonx")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "2037")

def get_connection(
    dbname: Optional[str] = None,
    user: Optional[str] = None,
    password: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None
):
    """
    Establishes and returns a connection to the PostgreSQL database.
    """
    return psycopg2.connect(
        dbname=dbname or os.getenv("DB_NAME", DB_NAME),
        user=user or os.getenv("DB_USER", DB_USER),
        password=password if password is not None else os.getenv("DB_PASSWORD", DB_PASSWORD),
        host=host or os.getenv("DB_HOST", DB_HOST),
        port=port or int(os.getenv("DB_PORT", str(DB_PORT))),
        connect_timeout=5
    )

@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Context manager providing a dictionary cursor.
    Automatically commits if commit=True and closes the connection.
    """
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        yield cur
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

def test_db_connection() -> Dict[str, Any]:
    """
    Tests database connectivity and reports status and table count.
    """
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT current_database(), current_user, version();")
            info = cur.fetchone()
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = [r["table_name"] for r in cur.fetchall()]
            return {
                "connected": True,
                "database": info["current_database"],
                "user": info["current_user"],
                "version": info["version"].split(",")[0],
                "tables": tables,
                "table_count": len(tables)
            }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "hint": "Check DB_PASSWORD or connection settings in backend/.env"
        }

