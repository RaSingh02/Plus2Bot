import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">About Us</h1>
      <p className="text-gray-300">
        PlusTwo is a Twitch chat bot that allows viewers to give "+2" or "-2" points to other users in the chat. It tracks these interactions, manages cooldowns, and provides statistics.
      </p>
      <p className="text-gray-300">
        Our mission is to enhance the Twitch experience by providing interactive features that engage viewers and promote community interaction.
      </p>
    </div>
  );
};

export default About;