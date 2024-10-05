import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  console.log('Searching for username:', username);

  if (!username) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
  }

  try {
    const dbPath = path.resolve('./plus_two_data.db');
    console.log('Database path:', dbPath);

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const result = await db.get(
      'SELECT count, positive_count, negative_count, last_updated FROM plus_two_counts WHERE username = ?',
      username.toLowerCase()
    );

    await db.close();

    console.log('Query result:', result);

    if (result) {
      return NextResponse.json({
        username: username,
        count: result.count,
        positiveCount: result.positive_count,
        negativeCount: result.negative_count,
        lastUpdated: result.last_updated
      });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in user-stats API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}