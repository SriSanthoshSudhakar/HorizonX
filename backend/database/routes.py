from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from .connection import test_db_connection
from .operations import db_ops

router = APIRouter(prefix="/api/database", tags=["PostgreSQL Database"])

class InsertRecordRequest(BaseModel):
    table: str
    data: Dict[str, Any]

class InsertBatchRequest(BaseModel):
    table: str
    records: List[Dict[str, Any]]

@router.get("/status")
def get_database_status():
    """
    Checks connection to the horizonx PostgreSQL database and lists existing tables.
    """
    status = test_db_connection()
    return status

@router.get("/tables")
def list_tables():
    """
    Lists all public tables in the horizonx database.
    """
    try:
        tables = db_ops.get_all_tables()
        return {"tables": tables, "count": len(tables)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/schema/{table_name}")
def get_table_schema(table_name: str):
    """
    Returns column names and data types for the given table.
    """
    try:
        columns = db_ops.get_table_schema(table_name)
        if not columns:
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        return {"table": table_name, "columns": columns}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/insert")
def insert_record(req: InsertRecordRequest):
    """
    Inserts a new record into any table in horizonx.
    Example body:
    {
      "table": "your_table_name",
      "data": { "column1": "val", "column2": 123 }
    }
    """
    try:
        result = db_ops.insert_record(req.table, req.data)
        return {
            "success": True,
            "message": f"Successfully stored record in table '{req.table}'",
            "inserted": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to insert into '{req.table}': {str(e)}")

@router.post("/insert-batch")
def insert_batch(req: InsertBatchRequest):
    """
    Inserts multiple records into a table in a single transaction.
    """
    try:
        count = db_ops.insert_batch(req.table, req.records)
        return {
            "success": True,
            "message": f"Successfully stored {count} records in table '{req.table}'",
            "count": count
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to insert batch into '{req.table}': {str(e)}")

@router.get("/records/{table_name}")
def get_records(
    table_name: str,
    limit: int = Query(default=50, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    order_by: Optional[str] = None,
    desc: bool = False
):
    """
    Retrieves stored records from the specified table.
    """
    try:
        rows = db_ops.get_records(table_name, limit=limit, offset=offset, order_by=order_by, descending=desc)
        return {"table": table_name, "count": len(rows), "records": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query '{table_name}': {str(e)}")

