import os
import re
import asyncio
import logging
from twitchio.ext import commands
from datetime import datetime, timedelta
from dotenv import load_dotenv

from .db_manager import DatabaseManager
from .utils import check_stream_status, is_valid_username
from .cooldown_manager import CooldownManager

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define cooldown period
COOLDOWN_PERIOD = timedelta(minutes=int(os.getenv('COOLDOWN_MINUTES', 2)))

class PlusTwoBot(commands.Bot):
    def __init__(self):
        # Initialize the bot
        super().__init__(
            token=os.getenv("ACCESS_TOKEN"),
            prefix='!',
            initial_channels=[os.getenv("BROADCASTER")]
        )
        self.initial_channels = [os.getenv("BROADCASTER")]
        self.client_id = os.getenv("CLIENT_ID")
        self.db_manager = DatabaseManager('plus_two_data.db')
        self.cooldown_manager = CooldownManager()  # Use the new CooldownManager
        self.total_plus_twos = 0
        self.load_data()
        self.current_chatters = {channel: set() for channel in self.initial_channels}
        self.chatter_last_seen = {channel: {} for channel in self.initial_channels}
        self.is_operating = False  # Track if the bot is currently operating

    def load_data(self):
        # Load data from database
        self.cooldown_manager.cooldown_tracker, self.total_plus_twos = self.db_manager.load_data()
        logging.info("Data loaded successfully.")

    def save_data(self):
        # Save data to database
        self.db_manager.save_data(self.cooldown_manager.cooldown_tracker, self.total_plus_twos)

    async def event_ready(self):
        # Called when the bot is ready
        logging.info(f'Logged in as | {self.nick}')
        
        # Check if the broadcaster is live
        is_live = await check_stream_status(self.client_id, os.getenv("ACCESS_TOKEN"), os.getenv("BROADCASTER"))
        if not is_live:
            logging.warning("The broadcaster is not live. The bot will not operate.")
            return  # Exit the method to prevent further actions

        # Start the bot's tasks if the broadcaster is live
        self.loop.create_task(self.stream_check_loop())
        self.loop.create_task(self.periodic_db_upload())
        self.loop.create_task(self.clean_inactive_chatters())
        self.loop.create_task(self.periodic_data_save())  # Start periodic saving

    def reset_total_count(self):
        # Reset the total +2 count
        self.total_plus_twos = 0
        logging.info("Total +2 count has been reset.")

    async def stream_check_loop(self):
        # Periodically check if the stream is live
        was_live = False
        check_interval = 300  # Start with 5 minutes
        while True:
            is_live = await check_stream_status(self.client_id, os.getenv("ACCESS_TOKEN"), os.getenv("BROADCASTER"))
            if not was_live and is_live:
                # The broadcaster just went live
                self.is_operating = True
                logging.info("The broadcaster is now live. The bot is now operating.")
                # You can start any additional tasks here if needed
            elif was_live and not is_live:
                # The broadcaster just went offline
                self.is_operating = False
                logging.warning("The broadcaster is no longer live. The bot will not operate.")
                # Optionally, you can reset counts or stop processing commands here

            was_live = is_live
            await asyncio.sleep(check_interval)  # Check every 5 minutes

            # Adjust check interval based on activity (example logic)
            if self.is_operating:
                check_interval = 300  # Keep checking every 5 minutes
            else:
                check_interval = 600  # Increase to 10 minutes when not operating

    async def event_message(self, message):
        # Called when a message is sent in the chat
        if message.echo or not message.content.strip():
            return

        # Ensure the bot is operating before processing messages
        if not self.is_operating:
            return

        # Ensure the channel is initialized in current_chatters
        if message.channel.name not in self.current_chatters:
            self.current_chatters[message.channel.name] = set()
            self.chatter_last_seen[message.channel.name] = {}

        # Update chatter list
        self.current_chatters[message.channel.name].add(message.author.name.lower())
        self.chatter_last_seen[message.channel.name][message.author.name.lower()] = datetime.now()

        # Check for +2 and -2 mentions
        plus_mentions = re.findall(r'\+2\s+@(\w+)', message.content, re.IGNORECASE)
        minus_mentions = re.findall(r'-2\s+@(\w+)', message.content, re.IGNORECASE)

        # Combine mentions into a single dictionary for batch processing
        mentions = {}
        for user in plus_mentions:
            mentions[user.lower()] = True  # Mark as +2
        for user in minus_mentions:
            mentions[user.lower()] = False  # Mark as -2

        # Process all mentions in batch
        await self.handle_batch_plus_two(message.channel, message.author, mentions)

    async def handle_batch_plus_two(self, channel, author, mentions):
        # Handle batch +2 or -2 commands
        for recipient, is_plus in mentions.items():
            if not is_valid_username(recipient):
                await channel.send(f"@{author.name}, '{recipient}' is not a valid username.")
                continue

            action = "+2" if is_plus else "-2"
            # Check if the author can give a +2
            if self.cooldown_manager.can_give_plus_two(author.name.lower(), COOLDOWN_PERIOD):
                if recipient in self.current_chatters.get(channel.name, set()):
                    self.update_count(recipient, is_plus)
                    self.data_changed = True  # Mark data as changed
                else:
                    await channel.send(f"@{recipient} is not in the chat.")
            else:
                time_left = self.cooldown_manager.get_cooldown_time(author.name.lower())
                await channel.send(f"@{author.name}, you must wait {time_left.seconds // 60} minutes and {time_left.seconds % 60} seconds before giving another {action} to anyone.")

        # Save data after processing all mentions
        self.save_data()

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

    @commands.command(name='commands')
    async def command_list(self, ctx):
        # Command to showcase list of available commands
        await ctx.send(f"!plus2stats !myplus2 !totalplus2")

    async def periodic_db_upload(self):
        while True:
            await asyncio.sleep(1800)  # Wait for 30 minutes
            self.db_manager.upload_db_artifact()

    async def clean_inactive_chatters(self):
        while True:
            await asyncio.sleep(900)  # Run every 15 minutes
            current_time = datetime.now()
            for channel in self.initial_channels:
                inactive_chatters = [
                    chatter for chatter, last_seen in self.chatter_last_seen[channel].items()
                    if (current_time - last_seen) > timedelta(minutes=30)
                ]
                for chatter in inactive_chatters:
                    self.current_chatters[channel].remove(chatter)
                    del self.chatter_last_seen[channel][chatter]
            logging.info(f"Cleaned inactive chatters. Current chatters: {sum(len(chatters) for chatters in self.current_chatters.values())}")

    async def periodic_data_save(self):
        while True:
            await asyncio.sleep(300)  # Save every 5 minutes
            self.save_data()  # Save data periodically