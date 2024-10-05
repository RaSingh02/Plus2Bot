# PlusTwo Twitch Bot and Website

PlusTwo is a Twitch chat bot that allows viewers to give "+2/+tuah" or "-2/-tuah" points to other users in the chat. It tracks these interactions, manages cooldowns, and provides statistics. The project also includes a website to display leaderboards and user stats.

## Features

- Users can give +2 or -2 to other active chat members
- Cooldown system to prevent spam (customizable via COOLDOWN_MINUTES environment variable)
- Tracks total +2 count for each stream session
- Provides commands for viewing personal and overall statistics
- Automatically resets counts when a stream ends
- Automatically cleans inactive chatters every 5 minutes

## Bot Setup and Commands

- `+2 @username`: Give +2 to a user
- `-2 @username`: Give -2 to a user
- `+tuah @username`: Give +tuah to a user
- `-tuah @username`: Give -tuah to a user
- `!plus2stats`: Show top 5 +2 recipients
- `!myplus2`: Show your personal +2 count
- `!totalplus2`: Show total +2 count for the current stream
- `!commands`: List all available commands

## Website Setup

1. Navigate to the `website` directory:
   ```bash
   cd website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the website.

## Running the Bot and Website Together

1. Start the bot:
   ```bash
   python main.py
   ```

2. In a separate terminal, start the website development server:
   ```bash
   cd website
   npm run dev
   ```

3. The bot will update the database, and the website will display the latest data.

## Project Structure

- `main.py`: Entry point of the bot application
- `utils/`: Contains bot-related utility files
- `website/`: Next.js website project
  - `app/`: Next.js app directory
  - `app/page.tsx`: Main page component
  - `app/api/`: API routes for fetching data
  - `app/components/`: React components

## Development

To extend the bot's functionality:

1. Add new commands in the `PlusTwoBot` class in `plus_two_bot.py`
2. Implement new database operations in `db_manager.py` if needed
3. Add utility functions in `utils.py`
4. Manage cooldowns using the `CooldownManager` class in `cooldown_manager.py`

To modify the website:

1. Edit components in the `website/app/` directory
2. Modify API routes in `website/app/api/` to fetch data from the database
3. Update styles in `website/app/globals.css` and `website/tailwind.config.ts`

## Leaderboard

You can view the PlusTwo leaderboard and search for user stats at:
https://rasingh02.github.io/Plus2Bot/

The leaderboard is updated daily and provides all-time, monthly, and yearly rankings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).