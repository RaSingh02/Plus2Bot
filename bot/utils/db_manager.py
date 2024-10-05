import os
import logging
import json
import sqlite3

from sqlite3 import connect
from contextlib import contextmanager
from queue import Queue

from datetime import datetime
from github import Github

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class DatabaseManager:
    def __init__(self, db_file):
        self.db_file = db_file
        self.conn = sqlite3.connect(db_file)
        self.conn.execute('PRAGMA foreign_keys = ON')
        self.connection_pool = Queue(maxsize=10)
        for _ in range(10):
            self.connection_pool.put(connect(db_file))
        self.create_tables()  # Add this line

    @contextmanager
    def get_connection(self):
        connection = self.connection_pool.get()
        try:
            yield connection
        finally:
            self.connection_pool.put(connection)

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
        try:
            with self.conn:
                self.conn.execute('DELETE FROM cooldown_tracker')
                for sender, recipients in cooldown_tracker.items():
                    for recipient, timestamp in recipients.items():
                        self.conn.execute('INSERT INTO cooldown_tracker (sender, recipient, timestamp) VALUES (?, ?, ?)', 
                                        (sender, recipient, timestamp.isoformat()))
                self.conn.execute('UPDATE total_counts SET count = ? WHERE id = 1', (total_plus_twos,))
            logging.info("Data saved successfully.")
        except Exception as e:
            logging.error(f"Error saving data: {e}")

    def update_count(self, username, new_count):
        with self.conn:
            self.conn.execute('''
                INSERT INTO plus_two_counts (username, count, last_updated) 
                VALUES (?, ?, CURRENT_TIMESTAMP) 
                ON CONFLICT(username) DO UPDATE SET 
                count = ?,
                last_updated = CURRENT_TIMESTAMP
            ''', (username.lower(), new_count, new_count))

    def get_top_recipients(self, limit):
        # Get top recipients of +2s
        cursor = self.conn.execute('SELECT username, count FROM plus_two_counts ORDER BY count DESC LIMIT ?', (limit,))
        return cursor.fetchall()

    def get_user_count(self, username):
        with self.conn:
            cursor = self.conn.execute('SELECT count FROM plus_two_counts WHERE username = ?', (username,))
            result = cursor.fetchone()
            return result[0] if result else 0

    def upload_db_artifact(self):
        if 'GITHUB_TOKEN' in os.environ:
            g = Github(os.environ['GITHUB_TOKEN'])
            repo = g.get_repo(os.environ['REPOSITORY_NAME'])
            with open(self.db_file, 'rb') as f:
                repo.create_git_blob(f.read(), "base64")

    def get_leaderboard(self, timeframe):
        if timeframe == 'all_time':
            query = 'SELECT username, count FROM plus_two_counts ORDER BY count DESC LIMIT 10'
        elif timeframe == 'yearly':
            query = '''
                SELECT username, count FROM plus_two_counts
                WHERE last_updated >= date('now', '-1 year')
                ORDER BY count DESC LIMIT 10
            '''
        elif timeframe == 'monthly':
            query = '''
                SELECT username, count FROM plus_two_counts
                WHERE last_updated >= date('now', '-1 month')
                ORDER BY count DESC LIMIT 10
            '''
        else:
            raise ValueError("Invalid timeframe")

        self.cursor.execute(query)
        return self.cursor.fetchall()

    def get_user_stats(self, username):
        self.cursor.execute('''
            SELECT count, last_updated FROM plus_two_counts
            WHERE username = ?
        ''', (username,))
        return self.cursor.fetchone()

    def export_data_for_website(self):
        all_time = self.get_leaderboard('all_time')
        yearly = self.get_leaderboard('yearly')
        monthly = self.get_leaderboard('monthly')

        data = {
            'all_time': all_time,
            'yearly': yearly,
            'monthly': monthly
        }

        with open('website/public/leaderboard_data.json', 'w') as f:
            json.dump(data, f)