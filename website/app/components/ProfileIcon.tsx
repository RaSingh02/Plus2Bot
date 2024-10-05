import React from 'react';
import { FaUser } from 'react-icons/fa';

interface ProfileIconProps {
  onClick: () => void;
}

const ProfileIcon: React.FC<ProfileIconProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full bg-primary-light dark:bg-primary-dark text-white hover:opacity-80 transition-opacity duration-200"
      aria-label="View profile"
    >
      <FaUser size={20} />
    </button>
  );
};

export default ProfileIcon;