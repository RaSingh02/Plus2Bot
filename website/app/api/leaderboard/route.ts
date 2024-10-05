import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { rateLimit } from '../../utils/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000, // Increase from 500 to 1000
});

export async function GET(request: NextRequest) {
  try {
    await limiter.check(request, 20, 'CACHE_TOKEN'); // Increase from 10 to 20 requests per minute per user
  } catch {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const db = await open({
      filename: './plus_two_data.db',
      driver: sqlite3.Database,
    });

    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const getTotalCount = async (timeframe: string) => {
      const query = timeframe === 'all_time' 
        ? 'SELECT COUNT(*) as count FROM plus_two_counts'
        : `SELECT COUNT(*) as count FROM plus_two_counts WHERE last_updated >= date("now", "-1 ${timeframe}")`;
      const result = await db.get(query);
      return result.count;
    };

    const all_time = await db.all('SELECT username, count FROM plus_two_counts ORDER BY count DESC LIMIT ? OFFSET ?', [pageSize, offset]);
    const yearly = await db.all('SELECT username, count FROM plus_two_counts WHERE last_updated >= date("now", "-1 year") ORDER BY count DESC LIMIT ? OFFSET ?', [pageSize, offset]);
    const monthly = await db.all('SELECT username, count FROM plus_two_counts WHERE last_updated >= date("now", "-1 month") ORDER BY count DESC LIMIT ? OFFSET ?', [pageSize, offset]);

    const totalCounts = {
      all_time: await getTotalCount('all_time'),
      yearly: await getTotalCount('year'),
      monthly: await getTotalCount('month')
    };

    const tugOfWar = await db.get('SELECT SUM(CASE WHEN count > 0 THEN count ELSE 0 END) as positive, SUM(CASE WHEN count < 0 THEN ABS(count) ELSE 0 END) as negative FROM plus_two_counts');

    await db.close();

    return NextResponse.json({ all_time, yearly, monthly, tugOfWar, totalCounts, currentPage: page, pageSize });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}