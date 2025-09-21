/**
 * Error Notification Panel Component
 * Displays user-friendly error notifications with actions
 * Requirements: 6.5 - User-friendly error messages for template issues
 */

import React, { useState, useEffect } from 'react';
import { ErrorNotification, getErrorNotificationService } from '../services/errorNotificationService';

interface ErrorNotificationPanelProps {
  className?: string;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ErrorNotificationPanel: React.FC<ErrorNotificationPanelProps> = ({
  className = '',
  maxNotifications = 5,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const errorService = getErrorNotificationService();

  useEffect(() => {
    // Subscribe to notification changes
    const unsubscribe = errorService.subscribe((newNotifications) => {
      // Limit the number of displayed notifications
      const limitedNotifications = newNotifications.slice(0, maxNotifications);
      setNotifications(limitedNotifications);
    });

    // Get initial notifications
    setNotifications(errorService.getActiveNotifications().slice(0, maxNotifications));

    return unsubscribe;
  }, [errorService, maxNotifications]);

  const handleDismiss = (id: string) => {
    errorService.dismissNotification(id);
  };

  const handleAction = async (action: () => void | Promise<void>, notificationId: string) => {
    try {
      await action();
      // Optionally dismiss notification after successful action
      handleDismiss(notificationId);
    } catch (error) {
      console.error('Error notification action failed:', error);
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 space-y-3 max-w-sm ${className}`}
      role="region"
      aria-label="Error notifications"
      aria-live="polite"
    >
      {notifications.map((notification) => (
        <ErrorNotificationCard
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
          onAction={handleAction}
        />
      ))}
    </div>
  );
};

interface ErrorNotificationCardProps {
  notification: ErrorNotification;
  onDismiss: (id: string) => void;
  onAction: (action: () => void | Promise<void>, notificationId: string) => void;
}

const ErrorNotificationCard: React.FC<ErrorNotificationCardProps> = ({
  notification,
  onDismiss,
  onAction
}) => {
  const getTypeStyles = (type: ErrorNotification['type']) => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: '⚠️',
          iconBg: 'bg-red-100'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: '⚠️',
          iconBg: 'bg-yellow-100'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'ℹ️',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const styles = getTypeStyles(notification.type);

  return (
    <div
      className={`border rounded-lg shadow-lg p-4 ${styles.container} animate-slide-in`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center mr-3`}>
          <span role="img" aria-label={`${notification.type} icon`}>
            {styles.icon}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1">
            {notification.title}
          </h4>
          <p className="text-sm mb-3">
            {notification.message}
          </p>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onAction(action.action, notification.id)}
                  className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                    action.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500'
                  }`}
                  aria-label={`${action.label} for ${notification.title}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {notification.dismissible && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
            aria-label={`Dismiss ${notification.title} notification`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// CSS for animations (would typically be in a CSS file)
const notificationStyles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('error-notification-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'error-notification-styles';
  styleElement.textContent = notificationStyles;
  document.head.appendChild(styleElement);
}

export default ErrorNotificationPanel;