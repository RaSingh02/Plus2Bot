import os
import re
import asyncio
import logging
from twitchio.ext import commands
from datetime import datetime, timedelta
from dotenv import load_dotenv
from queue import Queue
from threading import Thread

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
    def __init__(self, enable_tuah=False):
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
        self.enable_tuah = enable_tuah
        self.action_queue = Queue()
        self.queue_worker = Thread(target=self.process_queue)
        self.queue_worker.start()

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
        self.loop.create_task(self.export_data_for_website())

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
                logging.info(f"The broadcaster, {os.getenv('BROADCASTER')}, is now live. The bot is now operating.")
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
        if message.echo or not message.content.strip():
            return

        plus_two_mentions = re.findall(r'\+2\s+@(\w+)', message.content, re.IGNORECASE)
        minus_two_mentions = re.findall(r'-2\s+@(\w+)', message.content, re.IGNORECASE)
        
        mentions = {username: True for username in plus_two_mentions}
        mentions.update({username: False for username in minus_two_mentions})

        if self.enable_tuah:
            plus_tuah_mentions = re.findall(r'\+tuah\s+@(\w+)', message.content, re.IGNORECASE)
            minus_tuah_mentions = re.findall(r'-tuah\s+@(\w+)', message.content, re.IGNORECASE)
            
            mentions.update({username: True for username in plus_tuah_mentions})
            mentions.update({username: False for username in minus_tuah_mentions})

        # Process all mentions in batch
        await self.handle_batch_plus_two(message.channel, message.author, mentions)

    async def handle_batch_plus_two(self, channel, author, mentions):
        for recipient, is_plus in mentions.items():
            if not is_valid_username(recipient):
                await channel.send(f"@{author.name}, '{recipient}' is not a valid username.")
                continue

            if self.cooldown_manager.can_give_plus_two(author.name.lower(), COOLDOWN_PERIOD):
                if recipient in self.current_chatters.get(channel.name, set()):
                    self.action_queue.put((recipient, is_plus, author.name.lower()))
                else:
                    await channel.send(f"@{recipient} is not in the chat.")
            else:
                time_left = self.cooldown_manager.get_cooldown_time(author.name.lower())
                await channel.send(f"@{author.name}, you must wait {time_left.seconds // 60} minutes and {time_left.seconds % 60} seconds before giving another +2/-2 to anyone.")

    def process_queue(self):
        while True:
            action = self.action_queue.get()
            if action is None:
                break
            self.update_count(*action)
            self.action_queue.task_done()

    def update_count(self, username, is_plus, giver):
        # Update +2 count for a user
        change = 1 if is_plus else -1
        current_count = self.db_manager.get_user_count(username.lower())
        new_count = max(0, current_count + change)  # Ensure count doesn't go below 0
        self.db_manager.update_count(username.lower(), new_count)
        
        actual_change = new_count - current_count
        self.total_plus_twos += actual_change
        
        # Log the +2 action with the giver's name
        if is_plus:
            logging.info(f"{username} received a +2 from {giver}.")
        else:
            if actual_change == 0:
                logging.info(f"{username} received a -2 from {giver}, but their count was already at 0.")
            else:
                logging.info(f"{username} received a -2 from {giver}.")

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

    async def export_data_for_website(self):
        while True:
            await asyncio.sleep(300)  # Export data every 5 minutes
            self.db_manager.export_data_for_website()
            logging.info("Exported leaderboard data for website")