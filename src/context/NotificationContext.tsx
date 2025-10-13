import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message: string, duration?: number) => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showNotification = useCallback((
    type: NotificationType, 
    title: string, 
    message: string, 
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = { 
      id, 
      type, 
      title, 
      message, 
      duration,
      autoClose: true
    };
    
    setNotifications((prev) => [...prev, newNotification]);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    showNotification('success', title, message, duration);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    showNotification('error', title, message, duration);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    showNotification('warning', title, message, duration);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    showNotification('info', title, message, duration);
  }, [showNotification]);

  // Notification component
  const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    const config = {
      success: {
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-500',
        titleColor: 'text-green-900',
        messageColor: 'text-green-800',
        iconColor: 'text-green-600',
      },
      error: {
        icon: XCircleIcon,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500',
        titleColor: 'text-red-900',
        messageColor: 'text-red-800',
        iconColor: 'text-red-600',
      },
      warning: {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500',
        titleColor: 'text-amber-900',
        messageColor: 'text-amber-800',
        iconColor: 'text-amber-600',
      },
      info: {
        icon: InformationCircleIcon,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500',
        titleColor: 'text-blue-900',
        messageColor: 'text-blue-800',
        iconColor: 'text-blue-600',
      },
    };

    const { icon: Icon, bgColor, borderColor, titleColor, messageColor, iconColor } = config[notification.type];

    return (
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`mb-3 w-full max-w-sm ${bgColor} ${borderColor} border-l-4 rounded-lg shadow-lg p-4 relative overflow-hidden`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${titleColor}`}>{notification.title}</p>
            <p className={`text-sm ${messageColor}`}>{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className={`flex-shrink-0 ml-2 p-1 rounded-lg hover:bg-black/5 transition-colors ${titleColor}`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Progress bar for auto-close */}
        {notification.autoClose && notification.duration && notification.duration > 0 && (
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: notification.duration / 1000, ease: "linear" }}
            className={`absolute bottom-0 left-0 h-1 ${borderColor.replace('border', 'bg')}`}
          />
        )}
      </motion.div>
    );
  };

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo,
      removeNotification
    }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;