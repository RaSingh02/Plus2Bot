import sqlite3
from datetime import datetime
import json
import os

def get_leaderboard(db_path, period='all_time'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    if period == 'monthly':
        query = """
        SELECT username, count FROM plus_two_counts
        WHERE strftime('%Y-%m', last_updated) = strftime('%Y-%m', 'now')
        ORDER BY count DESC LIMIT 100
        """
    elif period == 'yearly':
        query = """
        SELECT username, count FROM plus_two_counts
        WHERE strftime('%Y', last_updated) = strftime('%Y', 'now')
        ORDER BY count DESC LIMIT 100
        """
    else:
        query = "SELECT username, count FROM plus_two_counts ORDER BY count DESC LIMIT 100"

    cursor.execute(query)
    leaderboard = cursor.fetchall()
    conn.close()
    return leaderboard

def get_user_stats(db_path, username):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT count FROM plus_two_counts WHERE username = ?", (username.lower(),))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else 0

def generate_html(leaderboard, period):
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PlusTwo Leaderboard - {period.capitalize()}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <h1>PlusTwo Leaderboard - {period.capitalize()}</h1>
        <nav>
            <a href="index.html">All-Time</a> |
            <a href="monthly.html">Monthly</a> |
            <a href="yearly.html">Yearly</a>
        </nav>
        <table>
            <tr><th>Rank</th><th>Username</th><th>+2 Count</th></tr>
    """
    for i, (username, count) in enumerate(leaderboard, 1):
        html += f"<tr><td>{i}</td><td>{username}</td><td>{count}</td></tr>"
    html += """
        </table>
        <h2>Search for a user</h2>
        <input type="text" id="username" placeholder="Enter Twitch username">
        <button onclick="searchUser()">Search</button>
        <div id="userStats"></div>
        <script>
        function searchUser() {
            const username = document.getElementById('username').value;
            fetch(`user_stats/${username.toLowerCase()}.json`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('userStats').innerHTML = `
                        <h3>${username}'s Stats</h3>
                        <p>+2 Count: ${data.count}</p>
                    `;
                })
                .catch(error => {
                    document.getElementById('userStats').innerHTML = `<p>User not found or error occurred.</p>`;
                });
        }
        </script>
    </body>
    </html>
    """
    return html

def main():
    db_path = 'plus_two_data.db'
    periods = ['all_time', 'monthly', 'yearly']

    os.makedirs('user_stats', exist_ok=True)

    for period in periods:
        leaderboard = get_leaderboard(db_path, period)
        html = generate_html(leaderboard, period)
        filename = 'index.html' if period == 'all_time' else f'{period}.html'
        with open(os.path.join('..', filename), 'w') as f:
            f.write(html)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT username, count FROM plus_two_counts")
    all_users = cursor.fetchall()
    conn.close()

    for username, count in all_users:
        user_data = {'username': username, 'count': count}
        with open(os.path.join('..', 'user_stats', f'{username.lower()}.json'), 'w') as f:
            json.dump(user_data, f)

if __name__ == "__main__":
    main()