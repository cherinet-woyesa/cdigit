import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  UserGroupIcon,
  CurrencyDollarIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface QueueNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  amount?: string;
}

const QueueNotificationModal: React.FC<QueueNotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  amount
}) => {
  // Auto-close after 8 seconds
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-20 z-50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with animated bell icon */}
            <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 p-6 relative overflow-hidden">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute top-4 right-4"
              >
                <BellIcon className="h-8 w-8 text-white opacity-20" />
              </motion.div>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">New Customer Alert</h3>
                  <p className="text-fuchsia-100 text-sm">{title}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-gray-700 font-medium text-sm leading-relaxed">
                    {message}
                  </p>
                </div>

                {amount && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-600">Transaction Amount</span>
                      </div>
                      <span className="text-lg font-bold text-emerald-700">
                        {amount}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Got It!
                  </button>
                  <button
                    onClick={onClose}
                    className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </motion.div>

              {/* Auto-close indicator */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full mt-4"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QueueNotificationModal;
