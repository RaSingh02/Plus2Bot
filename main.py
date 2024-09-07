import os
import re
import asyncio
import aiohttp
import logging
import sqlite3
from twitchio.ext import commands
from datetime import datetime, timedelta
from dotenv import load_dotenv

# loading variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

COOLDOWN_PERIOD = timedelta(minutes=2)
total_plus_twos = 0
active_users = set()  # Set to track active users
DB_FILE = 'plus_two_data.db'  # SQLite database file

class PlusTwoBot(commands.Bot):

    def __init__(self):
        super().__init__(
            token=os.getenv("ACCESS_TOKEN"),
            prefix='!',
            initial_channels=[os.getenv("BROADCASTER")]
        )
        self.client_id = os.getenv("CLIENT_ID")
        self.conn = sqlite3.connect(DB_FILE)
        self.create_tables()  # Create tables if they don't exist
        self.load_data()  # Load existing data on startup

    def create_tables(self):
        """Create the necessary tables in the database."""
        with self.conn:
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS plus_two_counts (
                    username TEXT PRIMARY KEY,
                    count INTEGER NOT NULL DEFAULT 0
                )
            ''')
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS cooldown_tracker (
                    sender TEXT,
                    recipient TEXT,
                    timestamp DATETIME,
                    PRIMARY KEY (sender, recipient)
                )
            ''')
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
        """Load plus_two_counts and cooldown_tracker from the database."""
        global total_plus_twos
        # Load plus_two_counts
        cursor = self.conn.execute('SELECT username, count FROM plus_two_counts')
        for row in cursor:
            username, count = row
            plus_two_counts[username] = count
        # Load cooldown_tracker
        cursor = self.conn.execute('SELECT sender, recipient, timestamp FROM cooldown_tracker')
        for row in cursor:
            sender, recipient, timestamp = row
            cooldown_tracker.setdefault(sender, {})[recipient] = datetime.fromisoformat(timestamp)
        # Load total_plus_twos
        cursor = self.conn.execute('SELECT count FROM total_counts WHERE id = 1')
        total_plus_twos = cursor.fetchone()[0]
        logging.info("Data loaded successfully.")

    def save_data(self):
        """Save plus_two_counts and cooldown_tracker to the database."""
        global total_plus_twos
        with self.conn:
            # Save plus_two_counts
            self.conn.execute('DELETE FROM plus_two_counts')  # Clear existing data
            for username, count in plus_two_counts.items():
                self.conn.execute('INSERT INTO plus_two_counts (username, count) VALUES (?, ?)', (username, count))
            # Save cooldown_tracker
            self.conn.execute('DELETE FROM cooldown_tracker')  # Clear existing data
            for sender, recipients in cooldown_tracker.items():
                for recipient, timestamp in recipients.items():
                    self.conn.execute('INSERT INTO cooldown_tracker (sender, recipient, timestamp) VALUES (?, ?, ?)', 
                                      (sender, recipient, timestamp.isoformat()))
            # Save total_plus_twos
            self.conn.execute('UPDATE total_counts SET count = ? WHERE id = 1', (total_plus_twos,))

    async def event_ready(self):
        logging.info(f'Logged in as | {self.nick}')
        self.loop.create_task(self.stream_check_loop())

    async def event_user_join(self, user, channel):
        active_users.add(user.name.lower())  # Add user to active users set
        logging.info(f"{user.name} has joined the chat.")

    async def event_user_part(self, user, channel):
        active_users.discard(user.name.lower())  # Remove user from active users set
        logging.info(f"{user.name} has left the chat.")

    async def check_stream_status(self):
        headers = {
            'Client-ID': os.getenv('CLIENT_ID'),
            'Authorization': f'Bearer {os.getenv("ACCESS_TOKEN")}'
        }
        url = f'https://api.twitch.tv/helix/streams?user_login={os.getenv("BROADCASTER")}'
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return len(data['data']) > 0  # True if stream is live, False otherwise
                    else:
                        logging.error(f"Error checking stream status: HTTP {response.status}")
                        return None
        except Exception as e:
            logging.error(f"Error checking stream status: {str(e)}")
            return None

    def reset_total_count(self):
        global total_plus_twos
        total_plus_twos = 0
        logging.info("Total +2 count has been reset.")

    async def stream_check_loop(self):
        was_live = True
        while True:
            is_live = await self.check_stream_status()
            if was_live and not is_live:
                self.reset_total_count()
                self.save_data()  # Save data when the stream ends
            was_live = is_live
            await asyncio.sleep(300)  # Check every 5 minutes

    async def event_message(self, message):
        if message.echo:
            return

        await self.handle_commands(message)

        # Find all +2 and -2 mentions in the message
        plus_mentions = re.findall(r'\+2\s+@(\w+)', message.content, re.IGNORECASE)
        minus_mentions = re.findall(r'-2\s+@(\w+)', message.content, re.IGNORECASE)
        
        for mentioned_user in plus_mentions:
            await self.handle_plus_two(message.channel, message.author, mentioned_user.lower(), is_plus=True)
        
        for mentioned_user in minus_mentions:
            await self.handle_plus_two(message.channel, message.author, mentioned_user.lower(), is_plus=False)

    def parse_message(self, content):
        parts = content.split()
        if len(parts) >= 2 and parts[0].lower() == '+2' and parts[1].startswith('@'):
            return parts[1][1:].lower()
        return None

    async def handle_plus_two(self, channel, author, recipient, is_plus):
        if not recipient:
            return

        if len(recipient) > 25:  # Twitch usernames are limited to 25 characters
            await channel.send(f"@{author.name}, that doesn't seem to be a valid username.")
            return

        action = "+2" if is_plus else "-2"
        if self.can_give_plus_two(author.name.lower(), recipient):
            if await self.is_user_in_chat(recipient):
                self.update_count(recipient, is_plus)
                self.save_data()  # Save data after updating counts
                await channel.send(f"@{author.name} gave a {action} to @{recipient}!")
            else:
                await channel.send(f"@{recipient} is not in the chat.")
        else:
            time_left = COOLDOWN_PERIOD - (datetime.now() - cooldown_tracker[author.name.lower()][recipient])
            await channel.send(f"@{author.name}, you must wait {time_left.seconds // 60} minutes and {time_left.seconds % 60} seconds before giving another {action} to @{recipient}")

    async def is_user_in_chat(self, username):
        return username.lower() in active_users  # Check if the username is in the active_users set

    def can_give_plus_two(self, sender, recipient):
        current_time = datetime.now()
        sender = sender.lower()
        recipient = recipient.lower()
        
        if sender not in cooldown_tracker:
            cooldown_tracker[sender] = {}
        
        if recipient in cooldown_tracker[sender]:
            if current_time - cooldown_tracker[sender][recipient] < COOLDOWN_PERIOD:
                return False
        
        cooldown_tracker[sender][recipient] = current_time
        return True

    def update_count(self, username, is_plus):
        global total_plus_twos
        username = username.lower()
        change = 1 if is_plus else -1
        plus_two_counts[username] = plus_two_counts.get(username, 0) + change
        total_plus_twos += change
        # Ensure counts don't go below 0
        plus_two_counts[username] = max(0, plus_two_counts[username])
        total_plus_twos = max(0, total_plus_twos)

    @commands.command(name='plus2stats')
    async def plus_two_stats(self, ctx):
        if not plus_two_counts:
            await ctx.send("No +2 stats available yet!")
        else:
            top_5 = sorted(plus_two_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            stats = ", ".join([f"{user}: {count}" for user, count in top_5])
            await ctx.send(f"Top 5 +2 recipients: {stats}")

    @commands.command(name='myplus2')
    async def my_plus_two(self, ctx):
        username = ctx.author.name.lower()
        count = plus_two_counts.get(username, 0)
        await ctx.send(f"@{ctx.author.name}, you've been given {count} +2's!")

    @commands.command(name='totalplus2')
    async def total_plus_two(self, ctx):
        await ctx.send(f"Total +2's given in this stream: {total_plus_twos}")

bot = PlusTwoBot()
bot.run()
