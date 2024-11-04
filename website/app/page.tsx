'use client'
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowUp } from 'react-icons/fa';

import TugOfWarBar from './components/TugOfWarBar';
import UserCard from './components/UserCard';
import LeaderboardPodium from './components/LeaderboardPodium';
import SqueexQuote from './components/SqueexQuote';
import ErrorModal from './components/ErrorModal';
import LeaderboardTable from './components/LeaderboardTable';
import React from 'react';
import Footer from './components/Footer';
import NavBar from './components/NavBar';

interface LeaderboardData {
  all_time: [string, number][];
  yearly: [string, number][];
  monthly: [string, number][];
  tugOfWar: {
    positive: number;
    negative: number;
  };
  username: string;
  count: number;
  timeSpent: string;
}

const viewOrder = ['all_time', 'yearly', 'monthly'] as const;
type ViewType = typeof viewOrder[number];

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [searchUsername, setSearchUsername] = useState('');
  const [userStats, setUserStats] = useState<{ username: string; positiveCount: number; negativeCount: number; lastUpdated: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('all_time');
  const [previousView, setPreviousView] = useState<ViewType>('all_time');
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [displayedUsername, setDisplayedUsername] = useState<string | null>(null);
  const [showUserCard, setShowUserCard] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedPageSize = localStorage.getItem('pageSize');
      return savedPageSize ? parseInt(savedPageSize, 10) : 20;
    }
    return 20;
  });
  const [totalItems, setTotalItems] = useState(0);

  const [podiumData, setPodiumData] = useState<[string, number][]>([]);

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
    setIsLoading(true);
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
      setError('Failed to load leaderboard data');
      setLeaderboardData(null);
    }
    setIsLoading(false);
  }, [currentPage, pageSize, currentView]);

  useEffect(() => {
    setIsInitialized(true);
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
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };


    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedPageSize = localStorage.getItem('pageSize');
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize));
    }
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

  const pollLeaderboardData = () => {
    const pollInterval = setInterval(fetchLeaderboardData, 60000); // Poll every 60 seconds
    return () => clearInterval(pollInterval);
  };

  const viewOptions = [
    { key: 'all_time', label: 'All time' },
    { key: 'yearly', label: 'Yearly' },
    { key: 'monthly', label: 'Monthly' },
  ] as const;

  const handleViewChange = (newView: ViewType) => {
    setPreviousView(currentView);
    setCurrentView(newView);
    const currentIndex = viewOrder.indexOf(currentView);
    const newIndex = viewOrder.indexOf(newView);
    setDirection(newIndex > currentIndex ? 'right' : 'left');
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

  const handleUserHover = async (username: string) => {
    try {
      const response = await fetch(`/api/user-stats?username=${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isInitialized && (
        <div className="flex-grow bg-[#2d2d2d] text-gray-300 flex flex-col">
          <NavBar
            onUpdateUsername={handleUpdateUsername}
            onProfileClick={handleProfileClick}
            onSearch={handleSearch}
          />

          <div className="container mx-auto px-4 py-8 flex-grow">
            {/* User card */}
            <AnimatePresence mode="popLayout">
              {showUserCard && userStats && displayedUsername && (
                <AnimatedUserCardWrapper key="user-card-wrapper" isVisible={showUserCard}>
                  <UserCard 
                    username={displayedUsername}
                    positiveCount={userStats.positiveCount}
                    negativeCount={userStats.negativeCount}
                    lastUpdated={userStats.lastUpdated}
                    onClose={handleCloseUserCard}
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
            <nav className="flex justify-center space-x-2 mb-6">
              {viewOptions.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleViewChange(key)}
                  className={`px-4 py-2 rounded ${
                    currentView === key
                      ? 'bg-[#9147ff] text-white'
                      : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#3d3d3d]'
                  }`}
                >
                  {label}
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
                    barColor="#9147ff"
                    backgroundColor="#1a1a1a"
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
                    onUsernameClick={handleSearch}
                    onUserHover={handleUserHover}
                  />
                </div>
              </>
            )}
          </div>

          <footer className="bg-[#1a1a1a] text-white w-full">
            <div className="container mx-auto py-4">
              <div className="flex flex-col items-center space-y-1">
                <SqueexQuote />
                <Footer />
              </div>
            </div>
          </footer>
        </div>
      )}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-[#9147ff] text-white p-2 rounded-full shadow-lg hover:opacity-80 transition-opacity"
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