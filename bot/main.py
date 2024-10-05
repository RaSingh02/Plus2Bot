import os
from dotenv import load_dotenv
from utils.plus_two_bot import PlusTwoBot

load_dotenv()

ENABLE_TUAH = os.getenv('ENABLE_TUAH', 'false').lower() == 'true'

if __name__ == "__main__":
    try:
        bot = PlusTwoBot(enable_tuah=ENABLE_TUAH)
        bot.run()
    except Exception as e:
        print(f"Bot crashed with error: {e}")
    finally:
        bot.db_manager.export_data_for_website()