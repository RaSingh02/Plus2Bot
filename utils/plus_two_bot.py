import os
import re
import asyncio
import logging
from twitchio.ext import commands
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database_manager import DatabaseManager
from utils import check_stream_status, is_valid_username

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define cooldown period
COOLDOWN_PERIOD = os.getenv('COOLDOWN_MINUTES', 2)

class PlusTwoBot(commands.Bot):
    def __init__(self):
        # Initialize the bot
        super().__init__(
            token=os.getenv("ACCESS_TOKEN"),
            prefix='!',
            initial_channels=[os.getenv("BROADCASTER")]
        )
        self.client_id = os.getenv("CLIENT_ID")
        self.db_manager = DatabaseManager('plus_two_data.db')
        self.active_users = set()
        self.cooldown_tracker = {}
        self.total_plus_twos = 0
        self.load_data()

    def load_data(self):
        # Load data from database
        self.cooldown_tracker, self.total_plus_twos = self.db_manager.load_data()
        logging.info("Data loaded successfully.")

    def save_data(self):
        # Save data to database
        self.db_manager.save_data(self.cooldown_tracker, self.total_plus_twos)

    async def event_ready(self):
        # Called when the bot is ready
        logging.info(f'Logged in as | {self.nick}')
        self.loop.create_task(self.stream_check_loop())

    async def event_user_join(self, user, channel):
        # Called when a user joins the chat
        self.active_users.add(user.name.lower())
        logging.info(f"{user.name} has joined the chat.")

    async def event_user_part(self, user, channel):
        # Called when a user leaves the chat
        self.active_users.discard(user.name.lower())
        logging.info(f"{user.name} has left the chat.")

    def reset_total_count(self):
        # Reset the total +2 count
        self.total_plus_twos = 0
        logging.info("Total +2 count has been reset.")

    async def stream_check_loop(self):
        # Periodically check if the stream is live
        was_live = True
        while True:
            is_live = await check_stream_status(self.client_id, os.getenv("ACCESS_TOKEN"), os.getenv("BROADCASTER"))
            if was_live and not is_live:
                self.reset_total_count()
                self.save_data()
            was_live = is_live
            await asyncio.sleep(300)

    async def event_message(self, message):
        # Called when a message is sent in the chat
        if message.echo:
            return

        await self.handle_commands(message)

        # Check for +2 and -2 mentions
        plus_mentions = re.findall(r'\+2\s+@(\w+)', message.content, re.IGNORECASE)
        minus_mentions = re.findall(r'-2\s+@(\w+)', message.content, re.IGNORECASE)
        
        for mentioned_user in plus_mentions:
            await self.handle_plus_two(message.channel, message.author, mentioned_user.lower(), is_plus=True)
        
        for mentioned_user in minus_mentions:
            await self.handle_plus_two(message.channel, message.author, mentioned_user.lower(), is_plus=False)

    async def handle_plus_two(self, channel, author, recipient, is_plus):
        # Handle +2 or -2 command
        if not recipient or not is_valid_username(recipient):
            await channel.send(f"@{author.name}, that doesn't seem to be a valid username.")
            return

        action = "+2" if is_plus else "-2"
        if self.can_give_plus_two(author.name.lower(), recipient):
            if recipient.lower() in self.active_users:
                self.update_count(recipient, is_plus)
                self.save_data()
                await channel.send(f"@{author.name} gave a {action} to @{recipient}!")
            else:
                await channel.send(f"@{recipient} is not in the chat.")
        else:
            time_left = self.get_cooldown_time(author.name.lower(), recipient)
            await channel.send(f"@{author.name}, you must wait {time_left.seconds // 60} minutes and {time_left.seconds % 60} seconds before giving another {action} to @{recipient}")

    def can_give_plus_two(self, sender, recipient):
        # Check if a user can give +2 to another user
        current_time = datetime.now()
        sender, recipient = sender.lower(), recipient.lower()
        
        if sender not in self.cooldown_tracker:
            self.cooldown_tracker[sender] = {}
        
        if recipient in self.cooldown_tracker[sender]:
            if current_time - self.cooldown_tracker[sender][recipient] < COOLDOWN_PERIOD:
                return False
        
        self.cooldown_tracker[sender][recipient] = current_time
        return True

    def get_cooldown_time(self, sender, recipient):
        # Get remaining cooldown time
        return COOLDOWN_PERIOD - (datetime.now() - self.cooldown_tracker[sender.lower()][recipient.lower()])

    def update_count(self, username, is_plus):
        # Update +2 count for a user
        change = 1 if is_plus else -1
        self.db_manager.update_count(username.lower(), change)
        self.total_plus_twos += change
        self.total_plus_twos = max(0, self.total_plus_twos)

    @commands.command(name='plus2stats')
    async def plus_two_stats(self, ctx):
        # Command to show top 5 +2 recipients
        top_5 = self.db_manager.get_top_recipients(5)
        if not top_5:
            await ctx.send("No +2 stats available yet!")
        else:
            stats = ", ".join([f"{user}: {count}" for user, count in top_5])
            await ctx.send(f"Top 5 +2 recipients: {stats}")

    @commands.command(name='myplus2')
    async def my_plus_two(self, ctx):
        # Command to show user's +2 count
        count = self.db_manager.get_user_count(ctx.author.name.lower())
        await ctx.send(f"@{ctx.author.name}, you've been given {count} +2's!")

    @commands.command(name='totalplus2')
    async def total_plus_two(self, ctx):
        # Command to show total +2 count for the current stream
        await ctx.send(f"Total +2's given in this stream: {self.total_plus_twos}")