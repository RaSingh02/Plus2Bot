import time
from utils.plus_two_bot import PlusTwoBot

if __name__ == "__main__":
    while True:
        try:
            bot = PlusTwoBot()
            bot.run()
        except Exception as e:
            print(f"Bot crashed with error: {e}")
            print("Restarting in 60 seconds...")
            time.sleep(60)