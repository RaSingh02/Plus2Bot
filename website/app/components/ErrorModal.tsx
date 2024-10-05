import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 flex justify-center"
        >
          <div className="bg-accent-light dark:bg-accent-dark text-text-light dark:text-text-dark px-6 py-3 rounded-b-lg shadow-lg">
            <p>{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorModal;