import React, { useEffect, useState } from 'react';

interface TugOfWarProps {
  positive: number;
  negative: number;
}

const TugOfWarBar: React.FC<TugOfWarProps> = ({ positive, negative }) => {
  const [animatedPositive, setAnimatedPositive] = useState(0);
  const total = positive + negative;

  useEffect(() => {
    const animationDuration = 1000; // 1 second
    const steps = 60; // 60 frames per second
    const increment = positive / steps;
    let currentValue = 0;

    const interval = setInterval(() => {
      currentValue += increment;
      if (currentValue >= positive) {
        clearInterval(interval);
        setAnimatedPositive(positive);
      } else {
        setAnimatedPositive(currentValue);
      }
    }, animationDuration / steps);

    return () => clearInterval(interval);
  }, [positive]);

  const positivePercentage = (animatedPositive / total) * 100;

  return (
    <div className="w-full">
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-secondary-light dark:bg-secondary-dark transition-all duration-300 ease-out"
          style={{ width: `${positivePercentage}%` }}
        />
        <div className="absolute inset-0 flex justify-center items-center text-text-light dark:text-text-dark font-bold">
          {positivePercentage.toFixed(1)}% Positive
        </div>
      </div>
    </div>
  );
};

export default TugOfWarBar;