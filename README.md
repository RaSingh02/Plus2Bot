# PlusTwo Twitch Bot

PlusTwo is a Twitch chat bot that allows viewers to give "+2" or "-2" points to other users in the chat. It tracks these interactions, manages cooldowns, and provides statistics.

## Features

- Users can give +2 or -2 to other active chat members
- Cooldown system to prevent spam (customizable via COOLDOWN_MINUTES environment variable)
- Tracks total +2 count for each stream session
- Provides commands for viewing personal and overall statistics
- Automatically resets counts when a stream ends
- Automatically cleans inactive chatters every 5 minutes

## Commands

- `+2 @username`: Give +2 to a user
- `-2 @username`: Give -2 to a user
- `!plus2stats`: Show top 5 +2 recipients
- `!myplus2`: Show your personal +2 count
- `!totalplus2`: Show total +2 count for the current stream
- `!commands`: List all available commands

## Setup

1. Clone this repository
2. Install required packages:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   ACCESS_TOKEN=your_twitch_access_token
   CLIENT_ID=your_twitch_client_id
   BROADCASTER=channel_name_to_join
   COOLDOWN_MINUTES=2
   ```
   Note: `COOLDOWN_MINUTES` is optional and defaults to 2 if not specified.
4. Run the bot:
   ```
   python main.py
   ```

## Required Packages

- `twitchio`: Twitch chat bot framework
- `python-dotenv`: For loading environment variables
- `aiohttp`: For asynchronous HTTP requests
- `sqlite3`: For database management (included in Python standard library)

## Project Structure

- `main.py`: Entry point of the application
- `utils/plus_two_bot.py`: Main bot logic
- `utils/db_manager.py`: Database operations
- `utils/utils.py`: Utility functions

## Development

To extend the bot's functionality:

1. Add new commands in the `PlusTwoBot` class in `plus_two_bot.py`
2. Implement new database operations in `db_manager.py` if needed
3. Add utility functions in `utils.py`

## Leaderboard

You can view the PlusTwo leaderboard and search for user stats at:
https://rasingh02.github.io/Plus2Bot/

The leaderboard is updated daily and provides all-time, monthly, and yearly rankings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).