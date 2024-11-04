import os
import logging
import asyncio
from typing import Optional
from twitchio.ext import commands
from dotenv import load_dotenv
from utils.db_manager import DatabaseManager
from collections import defaultdict
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Define cooldown period
COOLDOWN_MINUTES = int(os.getenv('COOLDOWN_MINUTES', 2))
GENERAL_COOLDOWN_SECONDS = 5

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('plus_two_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('plus_two_bot')

def general_cooldown():
    def decorator(func):
        last_used = {}
        async def wrapper(self, ctx, *args, **kwargs):
            current_time = asyncio.get_event_loop().time()
            if ctx.author.name in last_used:
                elapsed = current_time - last_used[ctx.author.name]
                if elapsed < GENERAL_COOLDOWN_SECONDS:
                    return  # Silently ignore the command if on cooldown
            last_used[ctx.author.name] = current_time
            return await func(self, ctx, *args, **kwargs)
        return commands.command(name=func.__name__)(wrapper)
    return decorator

class PlusTwoBot(commands.Bot):
    def __init__(self):
        super().__init__(
            token=os.getenv("ACCESS_TOKEN"),
            prefix=['!', '+2 ', '-2 ', '+2@', '-2@'],
            initial_channels=[os.getenv("BROADCASTER")]
        )
        
        # Initialize database
        try:
            self.db = DatabaseManager()
            logger.info("Bot initialized with database connection")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

        self.daily_usage = defaultdict(int)
        self.last_reset = datetime.now()
        self.spam_tracker = defaultdict(list)
        self.blacklist = set()

    async def event_ready(self):
        logger.info(f'Logged in as | {self.nick}')
        print(f'Logged in as | {self.nick}')
        self.loop.create_task(self.reset_daily_usage())

    async def reset_daily_usage(self):
        while True:
            now = datetime.now()
            if now.date() > self.last_reset.date():
                self.daily_usage.clear()
                self.last_reset = now
            await asyncio.sleep(3600)  # Check every hour

    def is_mod(self, ctx):
        return ctx.author.is_mod or ctx.author.name.lower() == os.getenv("BROADCASTER").lower()

    def check_spam(self, user):
        now = datetime.now()
        self.spam_tracker[user] = [t for t in self.spam_tracker[user] if now - t < timedelta(minutes=1)]
        self.spam_tracker[user].append(now)
        return len(self.spam_tracker[user]) > 5

    @commands.command(name='+2')
    @commands.cooldown(rate=1, per=COOLDOWN_MINUTES * 60, bucket=commands.Bucket.user)
    async def plus_two(self, ctx: commands.Context):
        content = ctx.message.content.lower()
        if content.startswith('+2 ') or content.startswith('+2@'):
            target = content.split(None, 1)[1].lstrip('@')
        else:
            target = ctx.message.content.split(None, 2)[1].lstrip('@') if len(ctx.message.content.split()) > 1 else None

        if not target or target.lower() == ctx.author.name.lower():
            await ctx.send(f"@{ctx.author.name}, you can't give +2 to yourself!")
            return

        if ctx.author.name.lower() in self.blacklist:
            await ctx.send(f"@{ctx.author.name}, you are not allowed to use this command.")
            return

        if self.check_spam(ctx.author.name.lower()):
            await ctx.send(f"@{ctx.author.name}, you are using commands too quickly. Please slow down.")
            return

        if self.daily_usage[ctx.author.name.lower()] >= 10:
            await ctx.send(f"@{ctx.author.name}, you've reached your daily limit for +2/-2 commands.")
            return

        self.db.update_counts(target, is_positive=True)
        self.daily_usage[ctx.author.name.lower()] += 1
        logger.info(f"+2: {ctx.author.name} -> {target}")
        await ctx.send(f"@{ctx.author.name} gave a +2 to @{target}!")

    @commands.command(name='-2')
    @commands.cooldown(rate=1, per=COOLDOWN_MINUTES * 60, bucket=commands.Bucket.user)
    async def minus_two(self, ctx: commands.Context):
        content = ctx.message.content.lower()
        if content.startswith('-2 ') or content.startswith('-2@'):
            target = content.split(None, 1)[1].lstrip('@')
        else:
            target = ctx.message.content.split(None, 2)[1].lstrip('@') if len(ctx.message.content.split()) > 1 else None

        if not target or target.lower() == ctx.author.name.lower():
            await ctx.send(f"@{ctx.author.name}, you can't give -2 to yourself!")
            return

        if ctx.author.name.lower() in self.blacklist:
            await ctx.send(f"@{ctx.author.name}, you are not allowed to use this command.")
            return

        if self.check_spam(ctx.author.name.lower()):
            await ctx.send(f"@{ctx.author.name}, you are using commands too quickly. Please slow down.")
            return

        if self.daily_usage[ctx.author.name.lower()] >= 10:
            await ctx.send(f"@{ctx.author.name}, you've reached your daily limit for +2/-2 commands.")
            return

        current_count = self.db.get_user_count(target)
        if current_count > 0:
            self.db.update_counts(target, is_positive=False)
            self.daily_usage[ctx.author.name.lower()] += 1
            logger.info(f"-2: {ctx.author.name} -> {target}")
            await ctx.send(f"@{ctx.author.name} gave a -2 to @{target}!")
        else:
            await ctx.send(f"@{ctx.author.name}, {target}'s count is already 0 and can't go lower.")
            logger.info(f"-2: {ctx.author.name} -> {target} (failed: count already 0)")

    @general_cooldown()
    @commands.command(name='plus2stats')
    async def plus_two_stats(self, ctx: commands.Context):
        top_users = self.db.get_top_users(5)
        if not top_users:
            await ctx.send("No +2 stats available yet!")
            return
        stats = ", ".join([f"{user['username']}: {user['count']}" for user in top_users])
        await ctx.send(f"Top 5 +2 recipients: {stats}")

    @general_cooldown()
    @commands.command(name='myplus2')
    async def my_plus_two(self, ctx: commands.Context):
        count = self.db.get_user_count(ctx.author.name.lower())
        await ctx.send(f"@{ctx.author.name}, you've been given {count} +2's!")

    @general_cooldown()
    @commands.command(name='totalplus2')
    async def total_plus_two(self, ctx: commands.Context):
        total = self.db.get_total_plus_twos()
        await ctx.send(f"Total +2's given: {total}")

    @general_cooldown()
    @commands.command(name='commands')
    async def command_list(self, ctx: commands.Context):
        await ctx.send("Available commands: +2 @user, -2 @user, !+2 @user, !-2 @user, !plus2stats, !myplus2, !totalplus2")

    @general_cooldown()
    @commands.command(name='website')
    async def website(self, ctx: commands.Context):
        await ctx.send("Website still in development. Coming soon!")

    @commands.command(name='blacklist')
    async def blacklist_user(self, ctx: commands.Context, user: str):
        if not self.is_mod(ctx):
            await ctx.send(f"@{ctx.author.name}, only moderators can use this command.")
            return
        self.blacklist.add(user.lower())
        await ctx.send(f"@{user} has been blacklisted from using bot commands.")

    @commands.command(name='reset_user')
    async def reset_user(self, ctx: commands.Context, user: str):
        if not self.is_mod(ctx):
            await ctx.send(f"@{ctx.author.name}, only moderators can use this command.")
            return
        self.db.reset_user_count(user.lower())
        await ctx.send(f"@{user}'s +2 count has been reset to 0.")

    async def event_command_error(self, ctx: commands.Context, error: Exception):
        if isinstance(error, commands.CommandOnCooldown):
            logger.info(f"Cooldown: {ctx.author.name} attempted command too soon ({int(error.retry_after)}s remaining)")
            await ctx.send(f"@{ctx.author.name}, you must wait {int(error.retry_after)} seconds before giving another +2/-2!")
        elif isinstance(error, commands.CommandNotFound):
            return  # Ignore command not found errors
        else:
            logger.error(f"Error in command {ctx.command}: {error}", exc_info=True)
            print(f"Error: {error}")  # Log other errors for debugging

def prepare(bot: commands.Bot):
    bot.add_cog(PlusTwoBot())
