from typing import Dict, Any, List, Optional
from psycopg2 import sql
from .connection import get_db_cursor

class DatabaseOperations:
    """
    Generic & robust operations to insert, query, update, and manage
    data inside any table of the HorizonX PostgreSQL database.
    """

    @staticmethod
    def insert_record(table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inserts a single row of key-value pairs into the specified table.
        Returns the inserted record (via RETURNING *).
        """
        if not data:
            raise ValueError("No data provided for insertion")

        columns = list(data.keys())
        values = list(data.values())

        query = sql.SQL(
            "INSERT INTO {table} ({fields}) VALUES ({placeholders}) RETURNING *;"
        ).format(
            table=sql.Identifier(table_name),
            fields=sql.SQL(", ").join(map(sql.Identifier, columns)),
            placeholders=sql.SQL(", ").join(sql.Placeholder() * len(values))
        )

        with get_db_cursor(commit=True) as cur:
            cur.execute(query, values)
            row = cur.fetchone()
            return dict(row) if row else data

    @staticmethod
    def insert_batch(table_name: str, records: List[Dict[str, Any]]) -> int:
        """
        Inserts multiple rows in a single committed transaction.
        Returns the number of rows inserted.
        """
        if not records:
            return 0

        columns = list(records[0].keys())
        query = sql.SQL(
            "INSERT INTO {table} ({fields}) VALUES ({placeholders});"
        ).format(
            table=sql.Identifier(table_name),
            fields=sql.SQL(", ").join(map(sql.Identifier, columns)),
            placeholders=sql.SQL(", ").join(sql.Placeholder() * len(columns))
        )

        with get_db_cursor(commit=True) as cur:
            for rec in records:
                cur.execute(query, [rec.get(col) for col in columns])
        return len(records)

    @staticmethod
    def get_records(
        table_name: str, 
        limit: int = 100, 
        offset: int = 0, 
        order_by: Optional[str] = None,
        descending: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Fetches records from the specified table.
        """
        if order_by:
            direction = sql.SQL("DESC") if descending else sql.SQL("ASC")
            query = sql.SQL(
                "SELECT * FROM {table} ORDER BY {order_col} {direction} LIMIT %s OFFSET %s;"
            ).format(
                table=sql.Identifier(table_name),
                order_col=sql.Identifier(order_by),
                direction=direction
            )
        else:
            query = sql.SQL("SELECT * FROM {table} LIMIT %s OFFSET %s;").format(
                table=sql.Identifier(table_name)
            )

        with get_db_cursor() as cur:
            cur.execute(query, (limit, offset))
            records = []
            for r in cur.fetchall():
                row = dict(r)
                for k, v in row.items():
                    if isinstance(v, (bytes, memoryview)):
                        row[k] = f"<binary data: {len(v)} bytes>"
                    elif hasattr(v, "isoformat"):
                        row[k] = v.isoformat()
                records.append(row)
            return records

    @staticmethod
    def get_table_schema(table_name: str) -> List[Dict[str, Any]]:
        """
        Inspects the column structure and types of any table.
        """
        query = """
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position;
        """
        with get_db_cursor() as cur:
            cur.execute(query, (table_name,))
            return [dict(r) for r in cur.fetchall()]

    @staticmethod
    def get_all_tables() -> List[str]:
        """
        Returns all user table names in the horizonx database.
        """
        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """
        with get_db_cursor() as cur:
            cur.execute(query)
            return [r["table_name"] for r in cur.fetchall()]

db_ops = DatabaseOperations()

