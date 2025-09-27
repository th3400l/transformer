/**
 * Error Notification Panel Component
 * Displays user-friendly error notifications with actions
 * Enhanced for toast-style notifications with font upload error support
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.5 - User-friendly error messages and notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ErrorNotification, getErrorNotificationService } from '../services/errorNotificationService';
import { getFontErrorNotificationService } from '../services/fontErrorNotificationService';

interface ErrorNotificationPanelProps {
  className?: string;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableFontNotifications?: boolean;
  stackNotifications?: boolean;
  autoStackLimit?: number;
}

export const ErrorNotificationPanel: React.FC<ErrorNotificationPanelProps> = ({
  className = '',
  maxNotifications = 5,
  position = 'top-right',
  enableFontNotifications = true,
  stackNotifications = true,
  autoStackLimit = 3
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const [stackedNotifications, setStackedNotifications] = useState<Map<string, ErrorNotification[]>>(new Map());
  const errorService = getErrorNotificationService();
  const fontErrorService = getFontErrorNotificationService();

  const updateNotifications = useCallback(() => {
    const combinedNotifications = [
      ...errorService.getActiveNotifications(),
      ...(enableFontNotifications ? fontErrorService.getActiveNotifications() : [])
    ];

    if (stackNotifications) {
      // Group similar notifications for stacking
      const grouped = groupSimilarNotifications(combinedNotifications);
      setStackedNotifications(grouped);
      
      // Convert stacked notifications to display format
      const displayNotifications = convertStackedToDisplay(grouped);
      setNotifications(displayNotifications.slice(0, maxNotifications));
    } else {
      // Simple limit without stacking
      setStackedNotifications(new Map());
      setNotifications(combinedNotifications.slice(0, maxNotifications));
    }
  }, [
    enableFontNotifications,
    errorService,
    fontErrorService,
    maxNotifications,
    stackNotifications,
    autoStackLimit
  ]);

  useEffect(() => {
    const subscriptions: (() => void)[] = [];

    // Subscribe to general error notifications
    const unsubscribeGeneral = errorService.subscribe(() => {
      updateNotifications();
    });
    subscriptions.push(unsubscribeGeneral);

    // Subscribe to font error notifications if enabled
    if (enableFontNotifications) {
      const unsubscribeFont = fontErrorService.subscribe(() => {
        updateNotifications();
      });
      subscriptions.push(unsubscribeFont);
    }

    // Prime with current notifications
    updateNotifications();

    return () => {
      subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [errorService, fontErrorService, enableFontNotifications, updateNotifications]);

  const groupSimilarNotifications = (notifications: ErrorNotification[]): Map<string, ErrorNotification[]> => {
    const grouped = new Map<string, ErrorNotification[]>();
    
    notifications.forEach(notification => {
      // Group by title and type for similar notifications
      const groupKey = `${notification.type}-${notification.title}`;
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      
      const group = grouped.get(groupKey)!;
      group.push(notification);
      
      // Limit stack size
      if (group.length > autoStackLimit) {
        group.shift(); // Remove oldest
      }
    });
    
    return grouped;
  };

  const convertStackedToDisplay = (stacked: Map<string, ErrorNotification[]>): ErrorNotification[] => {
    const display: ErrorNotification[] = [];
    
    stacked.forEach((group, groupKey) => {
      if (group.length === 1) {
        // Single notification, display as-is
        display.push(group[0]);
      } else {
        // Multiple notifications, create stacked notification
        const latest = group[group.length - 1];
        const stackedNotification: ErrorNotification = {
          ...latest,
          id: `stacked-${groupKey}-${Date.now()}`,
          title: `${latest.title} (${group.length})`,
          message: group.length > 1 
            ? `${latest.message} (and ${group.length - 1} similar ${group.length === 2 ? 'notification' : 'notifications'})`
            : latest.message,
          actions: [
            ...(latest.actions || []),
            {
              label: 'View All',
              action: () => expandStackedNotifications(groupKey, group)
            }
          ]
        };
        display.push(stackedNotification);
      }
    });
    
    // Sort by timestamp (newest first)
    return display.sort((a, b) => {
      const aTime = parseInt(a.id.split('-').pop() || '0');
      const bTime = parseInt(b.id.split('-').pop() || '0');
      return bTime - aTime;
    });
  };

  const expandStackedNotifications = (groupKey: string, group: ErrorNotification[]) => {
    // Show all notifications in the stack individually
    group.forEach(notification => {
      const expandedNotification = {
        ...notification,
        id: `expanded-${notification.id}-${Date.now()}`,
        title: `${notification.title} (Expanded)`,
        autoHide: false // Prevent auto-hide for expanded notifications
      };
      
      // Add to both services to ensure proper tracking
      if (notification.title.toLowerCase().includes('font')) {
        fontErrorService.showNotification(expandedNotification);
      } else {
        errorService.showNotification(expandedNotification);
      }
    });
  };

  const handleDismiss = (id: string) => {
    // Try to dismiss from both services
    errorService.dismissNotification(id);
    if (enableFontNotifications) {
      fontErrorService.dismissNotification(id);
    }
    
    // Handle stacked notification dismissal
    if (id.startsWith('stacked-')) {
      const groupKey = id.replace('stacked-', '').split('-').slice(0, -1).join('-');
      const group = stackedNotifications.get(groupKey);
      if (group) {
        // Dismiss all notifications in the stack
        group.forEach(notification => {
          errorService.dismissNotification(notification.id);
          if (enableFontNotifications) {
            fontErrorService.dismissNotification(notification.id);
          }
        });
      }
    }
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
          container: 'bg-red-50 border-red-200 text-red-800 shadow-lg',
          badgeBg: 'bg-red-100 border border-red-200',
          badgeText: 'text-red-700',
          label: 'Error'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-lg',
          badgeBg: 'bg-yellow-100 border border-yellow-200',
          badgeText: 'text-yellow-700',
          label: 'Alert'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800 shadow-lg',
          badgeBg: 'bg-green-100 border border-green-200',
          badgeText: 'text-green-700',
          label: 'Done'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800 shadow-lg',
          badgeBg: 'bg-blue-100 border border-blue-200',
          badgeText: 'text-blue-700',
          label: 'Info'
        };
    }
  };

  const styles = getTypeStyles(notification.type);

  // Auto-dismiss functionality
  useEffect(() => {
    if (notification.autoHide && notification.duration) {
      const timer = setTimeout(() => {
        onDismiss(notification.id);
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, notification.duration, notification.id, onDismiss]);

  return (
    <div
      className={`border rounded-lg p-4 ${styles.container} animate-slide-in toast-notification`}
      role="alert"
      aria-live="assertive"
      data-notification-type={notification.type}
      data-notification-id={notification.id}
    >
      <div className="flex items-start">
        <div
          className={`flex-shrink-0 h-8 min-w-[2.5rem] px-3 rounded-full mr-3 flex items-center justify-center ${styles.badgeBg}`}
          aria-hidden="true"
        >
          <span className={`text-[0.65rem] font-semibold uppercase tracking-wide ${styles.badgeText}`}>
            {styles.label}
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

// CSS for toast-style animations and stacking
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
  
  @keyframes slide-out {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
  
  .animate-slide-out {
    animation: slide-out 0.3s ease-in;
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
  
  .toast-notification {
    backdrop-filter: blur(8px);
    transition: all 0.3s ease;
  }
  
  .toast-notification:hover {
    transform: translateX(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .notification-stack {
    position: relative;
  }
  
  .notification-stack::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: -4px;
    bottom: -4px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    z-index: -1;
  }
  
  .notification-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--accent-color);
    border-radius: 0 0 8px 8px;
    transition: width 0.1s linear;
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
