'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowUp } from 'react-icons/fa';

import TugOfWarBar from './components/TugOfWarBar';
import UserCard from './components/UserCard';
import LeaderboardPodium from './components/LeaderboardPodium';
import AnimatedSearchBar from './components/AnimatedSearchBar';
import SqueexQuote from './components/SqueexQuote';
import ErrorModal from './components/ErrorModal';
import LeaderboardTable from './components/LeaderboardTable';
import HamburgerMenu from './components/HamburgerMenu';

interface LeaderboardData {
  all_time: [string, number][];
  yearly: [string, number][];
  monthly: [string, number][];
  tugOfWar: {
    positive: number;
    negative: number;
  };
}

type ViewType = 'all_time' | 'yearly' | 'monthly';

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [userStats, setUserStats] = useState<{ username: string; positiveCount: number; negativeCount: number; lastUpdated: string } | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('all_time');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [displayedUsername, setDisplayedUsername] = useState<string | null>(null);
  const [showUserCard, setShowUserCard] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('pageSize') || '20', 10);
    }
    return 20;
  });
  const [totalItems, setTotalItems] = useState(0);
  const [podiumData, setPodiumData] = useState<[string, number][]>([]);

  const enableTuah = process.env.ENABLE_TUAH === 'true';

  const fetchPodiumData = useCallback(async () => {
    try {
      const response = await fetch(`/api/leaderboard?page=1&pageSize=3`);
      const data = await response.json();
      setPodiumData(data[currentView]);
    } catch (error) {
      console.error('Failed to fetch podium data:', error);
    }
  }, [currentView]);

  const fetchLeaderboardData = useCallback(async () => {
    try {
      const response = await fetch(`/api/leaderboard?page=${currentPage}&pageSize=${pageSize}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeaderboardData(data);
      setTotalItems(data.totalCounts[currentView]);
    } catch (error) {
      console.error('Failed to load leaderboard data:', error);
      setErrorMessage('Failed to load leaderboard data');
      setLeaderboardData(null);
    }
  }, [currentPage, pageSize, currentView]);

  const pollLeaderboardData = useCallback(() => {
    const pollInterval = setInterval(fetchLeaderboardData, 60000); // Poll every 60 seconds
    return () => clearInterval(pollInterval);
  }, [fetchLeaderboardData]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDarkMode = savedTheme ? savedTheme === 'dark' : prefersDarkMode;
    setIsDarkMode(initialDarkMode);
    setIsInitialized(true);

    document.documentElement.classList.toggle('dark', initialDarkMode);

    const savedUsername = localStorage.getItem('username');
    const userCardClosed = localStorage.getItem('userCardClosed');

    if (savedUsername) {
      setUsername(savedUsername);
      setDisplayedUsername(savedUsername);
      if (userCardClosed !== 'true') {
        handleSearch(savedUsername);
      }
    }

    fetchLeaderboardData();
    const cleanup = pollLeaderboardData();
    return cleanup;
  }, [fetchLeaderboardData, pollLeaderboardData]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode, isInitialized]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchPodiumData();
  }, [fetchPodiumData]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const handleSearch = async (searchUsername: string) => {
    try {
      const response = await fetch(`/api/user-stats?username=${encodeURIComponent(searchUsername)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUserStats(data);
      setErrorMessage(null);
      setShowUserCard(true);
      setDisplayedUsername(searchUsername);
      localStorage.setItem('displayedUsername', searchUsername);
      localStorage.setItem('userCardClosed', 'false');
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setErrorMessage('Error fetching user stats. Please try again.');
      setUserStats(null);
    }
  };

  const handleCloseUserCard = () => {
    setShowUserCard(false);
    localStorage.setItem('userCardClosed', 'true');
    setDisplayedUsername(username);
  };

  const toggleColorMode = () => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  const viewOptions = [
    { key: 'all_time', label: 'All time' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'monthly', label: 'Monthly' },
  ] as const;

  const handleViewChange = (newView: ViewType) => {
    setCurrentView(newView);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = () => {
    if (username) {
      handleSearch(username);
    } else {
      const newUsername = prompt('Please enter your username:');
      if (newUsername) {
        setUsername(newUsername);
        localStorage.setItem('username', newUsername);
        handleSearch(newUsername);
      }
    }
  };

  const handleUpdateUsername = (newUsername: string) => {
    setUsername(newUsername);
    setDisplayedUsername(newUsername);
    localStorage.setItem('username', newUsername);
    handleSearch(newUsername);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    localStorage.setItem('pageSize', newPageSize.toString());
    setCurrentPage(1);
    fetchLeaderboardData();
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {isInitialized && (
        <div className="flex-grow bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary-light dark:text-primary-dark transition-all duration-300 ease-in-out">
                Squeex +2 Leaderboard
              </h1>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <AnimatedSearchBar onSearch={handleSearch} />
                <HamburgerMenu
                  isDarkMode={isDarkMode}
                  toggleColorMode={toggleColorMode}
                  onUpdateUsername={handleUpdateUsername}
                  onProfileClick={handleProfileClick}
                />
              </div>
            </header>

            {/* User card */}
            <AnimatePresence mode="popLayout">
              {showUserCard && userStats && displayedUsername && (
                <AnimatedUserCardWrapper key="user-card-wrapper" isVisible={showUserCard}>
                  <UserCard 
                    username={displayedUsername}
                    positiveCount={userStats.positiveCount}
                    negativeCount={userStats.negativeCount}
                    lastUpdated={userStats.lastUpdated}
                    isDarkMode={isDarkMode}
                    onClose={handleCloseUserCard}
                    enableTuah={enableTuah}
                  />
                </AnimatedUserCardWrapper>
              )}
            </AnimatePresence>

            {/* Tug of War component */}
            {leaderboardData && leaderboardData.tugOfWar && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-center">Tug of War</h2>
                <TugOfWarBar positive={leaderboardData.tugOfWar.positive} negative={leaderboardData.tugOfWar.negative} />
              </section>
            )}

            {/* View options */}
            <nav className="mb-4 flex justify-center space-x-4">
              {viewOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleViewChange(option.key)}
                  className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                    currentView === option.key
                      ? 'bg-primary-light dark:bg-primary-dark text-white font-bold'
                      : 'bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </nav>

            {/* Leaderboard components */}
            {leaderboardData && leaderboardData[currentView] && (
              <>
                <div className="mb-8 max-w-[1000px] mx-auto">
                  <LeaderboardPodium 
                    key={`podium-${currentView}`}
                    data={podiumData}
                    isDarkMode={isDarkMode}
                    barColor={''}
                    backgroundColor={''}
                    onUsernameClick={handleSearch}
                  />
                </div>
                <div className="w-full">
                  <LeaderboardTable 
                    data={leaderboardData[currentView]} 
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    isDarkMode={isDarkMode}
                    onUsernameClick={handleSearch}
                  />
                </div>
              </>
            )}
            
            {/* SqueexQuote */}
            <footer className="mt-auto pt-4">
              <SqueexQuote />
            </footer>
          </div>
        </div>
      )}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-primary-light dark:bg-primary-dark text-white p-2 rounded-full shadow-lg hover:bg-opacity-80 transition-opacity"
          aria-label="Back to top"
        >
          <FaArrowUp />
        </button>
      )}
      <ErrorModal message={errorMessage || ''} onClose={() => setErrorMessage(null)} />
    </div>
  );
}

const AnimatedUserCardWrapper = React.forwardRef<HTMLDivElement, { children: React.ReactNode; isVisible: boolean }>(
  ({ children, isVisible }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ height: 0 }}
        animate={{ height: isVisible ? 'auto' : 0 }}
        exit={{ height: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedUserCardWrapper.displayName = 'AnimatedUserCardWrapper';