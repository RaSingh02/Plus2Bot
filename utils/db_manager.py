import sqlite3
from datetime import datetime
import os
from github import Github

class DatabaseManager:
    def __init__(self, db_file):
        # Initialize database connection
        self.conn = sqlite3.connect(db_file)
        self.create_tables()

    def create_tables(self):
        # Create necessary tables if they don't exist
        with self.conn:
            # Table for storing +2 counts for each user
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS plus_two_counts (
                    username TEXT PRIMARY KEY,
                    count INTEGER NOT NULL DEFAULT 0,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # Table for tracking cooldowns between users
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS cooldown_tracker (
                    sender TEXT,
                    recipient TEXT,
                    timestamp DATETIME,
                    PRIMARY KEY (sender, recipient)
                )
            ''')
            # Table for storing total +2 count
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS total_counts (
                    id INTEGER PRIMARY KEY,
                    count INTEGER NOT NULL DEFAULT 0
                )
            ''')
            # Initialize total count if not exists
            if self.conn.execute('SELECT count FROM total_counts WHERE id = 1').fetchone() is None:
                self.conn.execute('INSERT INTO total_counts (id, count) VALUES (1, 0)')

    def load_data(self):
        # Load cooldown tracker and total +2 count from database
        cooldown_tracker = {}
        cursor = self.conn.execute('SELECT sender, recipient, timestamp FROM cooldown_tracker')
        for row in cursor:
            sender, recipient, timestamp = row
            cooldown_tracker.setdefault(sender, {})[recipient] = datetime.fromisoformat(timestamp)
        
        cursor = self.conn.execute('SELECT count FROM total_counts WHERE id = 1')
        total_plus_twos = cursor.fetchone()[0]
        
        return cooldown_tracker, total_plus_twos

    def save_data(self, cooldown_tracker, total_plus_twos):
        # Save cooldown tracker and total +2 count to database
        with self.conn:
            self.conn.execute('DELETE FROM cooldown_tracker')
            for sender, recipients in cooldown_tracker.items():
                for recipient, timestamp in recipients.items():
                    self.conn.execute('INSERT INTO cooldown_tracker (sender, recipient, timestamp) VALUES (?, ?, ?)', 
                                      (sender, recipient, timestamp.isoformat()))
            
            self.conn.execute('UPDATE total_counts SET count = ? WHERE id = 1', (total_plus_twos,))

    def update_count(self, username, change):
        # Update +2 count for a user
        with self.conn:
            self.conn.execute('''
                INSERT INTO plus_two_counts (username, count, last_updated) 
                VALUES (?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(username) DO UPDATE SET 
                count = count + ?,
                last_updated = CURRENT_TIMESTAMP
            ''', (username, change, change))

    def get_top_recipients(self, limit):
        # Get top recipients of +2s
        cursor = self.conn.execute('SELECT username, count FROM plus_two_counts ORDER BY count DESC LIMIT ?', (limit,))
        return cursor.fetchall()

    def get_user_count(self, username):
        # Get +2 count for a specific user
        cursor = self.conn.execute('SELECT count FROM plus_two_counts WHERE username = ?', (username,))
        result = cursor.fetchone()
        return result[0] if result else 0

    def upload_db_artifact(self):
        if 'GITHUB_TOKEN' in os.environ:
            g = Github(os.environ['GITHUB_TOKEN'])
            repo = g.get_repo(os.environ['GITHUB_REPOSITORY'])
            with open(self.db_file, 'rb') as f:
                content = f.read()
            repo.create_git_blob(content.decode('latin1'), 'base64')