const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve('./plus_two_data.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Drop the existing table if it exists
  db.run(`DROP TABLE IF EXISTS plus_two_counts`);

  // Create the table with the new schema
  db.run(`CREATE TABLE plus_two_counts (
    username TEXT PRIMARY KEY,
    count INTEGER,
    positive_count INTEGER,
    negative_count INTEGER,
    last_updated TEXT
  )`);

  // Insert sample data
  const stmt = db.prepare("INSERT OR REPLACE INTO plus_two_counts (username, count, positive_count, negative_count, last_updated) VALUES (?, ?, ?, ?, ?)");
  
  // Generate 100 sample users with varied counts and update times
  for (let i = 1; i <= 100; i++) {
    const username = `user${i}`;
    
    // Vary the count range based on the user index
    let positiveCount, negativeCount;
    if (i <= 10) {
      // Top 10 users have higher counts
      positiveCount = Math.floor(Math.random() * 5000) + 1000;
      negativeCount = Math.floor(Math.random() * 1000);
    } else if (i <= 50) {
      // Next 40 users have medium counts
      positiveCount = Math.floor(Math.random() * 1000) + 100;
      negativeCount = Math.floor(Math.random() * 200);
    } else {
      // Remaining users have lower counts, including some negatives
      positiveCount = Math.floor(Math.random() * 200);
      negativeCount = Math.floor(Math.random() * 100);
    }

    const count = positiveCount - negativeCount;

    // Vary the last_updated date
    let lastUpdated;
    if (i % 3 === 0) {
      // One-third of users updated in the last month
      lastUpdated = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    } else if (i % 3 === 1) {
      // One-third of users updated in the last year
      lastUpdated = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
    } else {
      // One-third of users updated more than a year ago
      lastUpdated = new Date(Date.now() - Math.floor(Math.random() * 730 * 24 * 60 * 60 * 1000));
    }

    stmt.run(username, count, positiveCount, negativeCount, lastUpdated.toISOString());
  }

  stmt.finalize();

  console.log("Database initialized with sample data.");
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed');
  }
});