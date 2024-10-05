import React, { useState, useEffect } from 'react';

const quotes = [
  "BAZINGA!",
];

const SqueexQuote: React.FC = () => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  return (
    <div className="text-center italic text-text-light dark:text-text-dark opacity-70">
      "{quote}" - Squeex
    </div>
  );
};

export default SqueexQuote;