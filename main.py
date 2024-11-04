import asyncio
from twitchio.ext import commands
from utils.plus_two_bot import PlusTwoBot
import uvicorn
from api import app

async def run_api():
    ssl_keyfile = "path/to/your/private_key.pem"
    ssl_certfile = "path/to/your/certificate.pem"
    
    config = uvicorn.Config(
        "main:app", 
        host="0.0.0.0", 
        port=443,  # Standard HTTPS port
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile,
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    bot = PlusTwoBot()
    api_task = asyncio.create_task(run_api())
    bot_task = asyncio.create_task(bot.start())
    await asyncio.gather(api_task, bot_task)

if __name__ == "__main__":
    asyncio.run(main())
