import os
import logging
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('db.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('db')

class DatabaseManager:
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Create data directory if it doesn't exist
            data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
            os.makedirs(data_dir, exist_ok=True)
            self.db_path = os.path.join(data_dir, 'plus_two.db')
        else:
            self.db_path = db_path
            
        logger.info(f"Using database path: {self.db_path}")
        self._init_db()
        
    def _init_db(self) -> None:
        """Initialize the database and create tables if they don't exist"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS plus_two_counts (
                        username TEXT PRIMARY KEY,
                        count INTEGER DEFAULT 0,
                        positive_count INTEGER DEFAULT 0,
                        negative_count INTEGER DEFAULT 0,
                        last_updated TEXT
                    )
                """)
                conn.commit()
                
            logger.info(f"Database initialized at: {self.db_path}")
        except sqlite3.Error as e:
            logger.error(f"Database initialization error: {e}")
            raise

    def update_counts(self, username: str, is_positive: bool) -> None:
        """Update user counts when they receive a +2 or -2"""
        current_time = datetime.now().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            # First try to get existing record
            result = conn.execute(
                "SELECT count, positive_count, negative_count FROM plus_two_counts WHERE username = ?",
                (username.lower(),)
            ).fetchone()

            if result:
                count, positive_count, negative_count = result
                if is_positive:
                    count += 1
                    positive_count += 1
                else:
                    count = max(0, count - 1)  # Ensure count doesn't go below 0
                    negative_count += 1

                conn.execute("""
                    UPDATE plus_two_counts 
                    SET count = ?, positive_count = ?, negative_count = ?, last_updated = ?
                    WHERE username = ?
                """, (count, positive_count, negative_count, current_time, username.lower()))
            else:
                # New user
                count = 1 if is_positive else 0
                positive_count = 1 if is_positive else 0
                negative_count = 0 if is_positive else 1
                
                conn.execute("""
                    INSERT INTO plus_two_counts (username, count, positive_count, negative_count, last_updated)
                    VALUES (?, ?, ?, ?, ?)
                """, (username.lower(), count, positive_count, negative_count, current_time))
            
            conn.commit()

    def get_user_stats(self, username: str) -> Optional[Dict]:
        """Get stats for a specific user"""
        with sqlite3.connect(self.db_path) as conn:
            result = conn.execute(
                "SELECT * FROM plus_two_counts WHERE username = ?",
                (username.lower(),)
            ).fetchone()
            
            if result:
                return {
                    "username": result[0],
                    "count": result[1],
                    "positive_count": result[2],
                    "negative_count": result[3],
                    "last_updated": result[4]
                }
            return None

    def get_top_users(self, limit: int = 5) -> List[Dict]:
        """Get top users by count"""
        with sqlite3.connect(self.db_path) as conn:
            results = conn.execute(
                "SELECT * FROM plus_two_counts ORDER BY count DESC LIMIT ?",
                (limit,)
            ).fetchall()
            
            return [{
                "username": row[0],
                "count": row[1],
                "positive_count": row[2],
                "negative_count": row[3],
                "last_updated": row[4]
            } for row in results]