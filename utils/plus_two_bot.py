import os
import logging
from typing import Optional
from twitchio.ext import commands
from dotenv import load_dotenv
from utils.db_manager import DatabaseManager

# Load environment variables
load_dotenv()

# Define cooldown period
COOLDOWN_MINUTES = int(os.getenv('COOLDOWN_MINUTES', 2))

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

class PlusTwoBot(commands.Bot):
    def __init__(self):
        super().__init__(
            token=os.getenv("ACCESS_TOKEN"),
            prefix='!',
            initial_channels=[os.getenv("BROADCASTER")]
        )
        
        # Initialize database
        try:
            self.db = DatabaseManager()
            logger.info("Bot initialized with database connection")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    async def event_ready(self):
        logger.info(f'Logged in as | {self.nick}')
        print(f'Logged in as | {self.nick}')

    @commands.command(name='+2')
    @commands.cooldown(rate=1, per=COOLDOWN_MINUTES * 60, bucket=commands.Bucket.user)
    async def plus_two(self, ctx: commands.Context, target: Optional[str] = None):
        if not target:
            logger.info(f"{ctx.author.name} attempted +2 command without target")
            await ctx.send(f"@{ctx.author.name}, please specify a user to give +2 to!")
            return
            
        target = target.lstrip('@').lower()
        
        # Update database
        self.db.update_counts(target, is_positive=True)
        logger.info(f"+2: {ctx.author.name} -> {target}")
        
        # Get updated stats
        stats = self.db.get_user_stats(target)
        await ctx.send(f"@{target} received a +2 from @{ctx.author.name}! (Total: {stats['count']})")

    @commands.command(name='-2')
    @commands.cooldown(rate=1, per=COOLDOWN_MINUTES * 60, bucket=commands.Bucket.user)
    async def minus_two(self, ctx: commands.Context, target: Optional[str] = None):
        if not target:
            logger.info(f"{ctx.author.name} attempted -2 command without target")
            await ctx.send(f"@{ctx.author.name}, please specify a user to give -2 to!")
            return
            
        # Remove @ if present and convert to lowercase
        target = target.lstrip('@').lower()
        
        # Get user from context
        user = ctx.get_user(target)
        
        # If user is None, we'll assume they're valid (they might be in chat but not cached)
        if user is None and target != ctx.author.name.lower():
            logger.debug(f"User {target} not found in cache but proceeding")
            pass
            
        # Update counts (ensure it doesn't go below 0)
        current_count = self.user_counts.get(target, 0)
        if current_count > 0:
            self.user_counts[target] = current_count - 1
            self.total_plus_twos -= 1
            logger.info(f"-2: {ctx.author.name} -> {target} (new count: {self.user_counts[target]})")
            await ctx.send(f"@{target} received a -2 from @{ctx.author.name}!")
        else:
            logger.info(f"-2: {ctx.author.name} -> {target} (failed: count already 0)")
            await ctx.send(f"@{target}'s +2 count is already at 0!")

    @commands.command(name='plus2stats')
    async def plus_two_stats(self, ctx: commands.Context):
        top_users = self.db.get_top_users(5)
        if not top_users:
            await ctx.send("No +2 stats available yet!")
            return
            
        stats = ", ".join([f"{user['username']}: {user['count']}" for user in top_users])
        await ctx.send(f"Top 5 +2 recipients: {stats}")

    @commands.command(name='myplus2')
    async def my_plus_two(self, ctx: commands.Context):
        count = self.user_counts.get(ctx.author.name.lower(), 0)
        await ctx.send(f"@{ctx.author.name}, you've been given {count} +2's!")

    @commands.command(name='totalplus2')
    async def total_plus_two(self, ctx: commands.Context):
        await ctx.send(f"Total +2's given in this stream: {self.total_plus_twos}")

    @commands.command(name='commands')
    async def command_list(self, ctx: commands.Context):
        await ctx.send("Available commands: !+2 @user, !-2 @user, !plus2stats, !myplus2, !totalplus2")

    @commands.command(name='website')
    async def website(self, ctx: commands.Context):
        await ctx.send("Website still in development. Coming soon!")

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