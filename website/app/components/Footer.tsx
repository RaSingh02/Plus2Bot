import React from 'react';

const Footer = () => {
  return (
    <div className="flex justify-between items-center w-full max-w-7xl mx-auto px-4">
      <div className="text-sm text-gray-300">
        SqueexPlus2 is created by{' '}
        <a 
          href="https://twitch.tv/Zerozmercy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#9147ff] hover:underline"
        >
          @Zerozmercy
        </a>
      </div>
      <div className="text-sm text-gray-500">
        This website is not affiliated with or endorsed by{' '}
        <span className="text-[#9147ff]">
          <a 
            href="https://twitch.tv/Squeex" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#9147ff] hover:underline"
          >
          Squeex
          </a>
        </span>{' '}
        or{' '}
        <span className="text-[#9147ff]">Twitch</span>.
      </div>
    </div>
  );
};

export default Footer;