import React, { useEffect, useState } from 'react';
import AnimatedLeaderboardBar from './AnimatedLeaderboardBar';

interface LeaderboardEntry {
  username: string;
  count: number;
}

interface LeaderboardListProps {
  data: LeaderboardEntry[] | [string, number][];
}

const LeaderboardList: React.FC<LeaderboardListProps> = ({ data }) => {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [data]);

  const getEntry = (entry: LeaderboardEntry | [string, number]): [string, number] => {
    if (Array.isArray(entry)) return entry;
    return [entry.username, entry.count];
  };

  const maxCount = Math.max(...data.map(entry => Math.abs(getEntry(entry)[1])));

  return (
    <div className="space-y-4">
      {data.map((entry, index) => {
        const [username, count] = getEntry(entry);
        return (
          <AnimatedLeaderboardBar
            key={`${animationKey}-${username}`}
            username={username}
            count={count}
            maxCount={maxCount}
            index={index}
          />
        );
      })}
    </div>
  );
};

export default LeaderboardList;