'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle, X, MessageSquare, Package, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Notification {
  id: string;
  type: 'expiry_warning' | 'expired' | 'low_stock' | 'unreplied_message' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  medicines?: {
    name: string;
    expiry_date: string;
  };
}

interface UnrepliedMessage {
  id: string;
  subject: string;
  sender: {
    full_name?: string;
    email: string;
  };
  created_at: string;
  tag: string;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  min_stock_level: number;
}

interface ExpiringMedicine {
  id: string;
  name: string;
  expiry_date: string;
  quantity: number;
  dosage?: string;
}

export default function Notifications({
  isOpen,
  onToggle
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unrepliedMessages, setUnrepliedMessages] = useState<UnrepliedMessage[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [expiringMedicines, setExpiringMedicines] = useState<ExpiringMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const isCollapsed = !isOpen;

  useEffect(() => {
    fetchAllData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnrepliedMessages(),
      fetchLowStockItems(),
      fetchExpiringMedicines()
      // Note: checkExpiringMedicines() should be called by a cron job, not the UI
    ]);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnrepliedMessages = async () => {
    try {
      // First get users to enrich message data
      const usersResponse = await fetch('/api/users');
      let users: any[] = [];
      if (usersResponse.ok) {
        users = await usersResponse.json();
      }

      const response = await fetch('/api/messages?type=received');
      if (response.ok) {
        const messages = await response.json();

        // Enrich messages with user data
        const enrichedMessages = messages.map((msg: any) => {
          const senderUser = users.find(u => u.id === msg.sender_id);
          return {
            ...msg,
            sender: senderUser || { id: msg.sender_id, email: 'Unknown', full_name: 'Unknown User' }
          };
        });

        // Filter for messages that haven't been replied to in the last 24 hours
        const unreplied = enrichedMessages.filter((msg: any) => {
          const messageDate = new Date(msg.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return messageDate > oneDayAgo && !msg.parent_message_id;
        });
        setUnrepliedMessages(unreplied);
      }
    } catch (error) {
      console.error('Error fetching unreplied messages:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('/api/inventory?low_stock=true');
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.medicines || []);
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    }
  };

  const fetchExpiringMedicines = async () => {
    try {
      // Use the dedicated expiring medicines endpoint
      const response = await fetch('/api/medicine/expiring?days=14');
      if (response.ok) {
        const medicines = await response.json();
        setExpiringMedicines(medicines);
      } else if (response.status === 403) {
        // User doesn't have permission to see all expiring medicines
        console.log('User does not have permission to view all expiring medicines');
        setExpiringMedicines([]);
      }
    } catch (error) {
      console.error('Error fetching expiring medicines:', error);
      // Fallback: try the user's own medicines
      try {
        const response = await fetch('/api/medicine');
        if (response.ok) {
          const medicines = await response.json();

          // Filter medicines expiring in the next 2 weeks (not already expired)
          const now = new Date();
          const twoWeeksFromNow = new Date();
          twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

          const expiring = medicines.filter((med: any) => {
            const expiryDate = new Date(med.expiry_date);
            return expiryDate >= now && expiryDate <= twoWeeksFromNow && med.quantity > 0;
          });

          setExpiringMedicines(expiring);
        }
      } catch (fallbackError) {
        console.error('Error in fallback fetch:', fallbackError);
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notificationId,
          is_read: true,
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'expired':
        return <AlertTriangle className="text-red-500" size={16} />;
      case 'expiry_warning':
        return <Clock className="text-yellow-500" size={16} />;
      case 'low_stock':
        return <Package className="text-orange-500" size={16} />;
      case 'unreplied_message':
        return <MessageSquare className="text-blue-500" size={16} />;
      case 'system':
        return <Bell className="text-purple-500" size={16} />;
      default:
        return <Bell className="text-gray-500" size={16} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'expired':
        return 'border-red-500/15 bg-red-500/5';
      case 'expiry_warning':
        return 'border-yellow-500/15 bg-yellow-500/5';
      case 'low_stock':
        return 'border-orange-500/15 bg-orange-500/5';
      case 'unreplied_message':
        return 'border-blue-500/15 bg-blue-500/5';
      case 'system':
        return 'border-purple-500/15 bg-purple-500/5';
      default:
        return 'border-gray-500/15 bg-gray-500/5';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const unreadCount = (notifications || []).filter(n => n && !n.is_read).length +
    (unrepliedMessages || []).length +
    (lowStockItems || []).length +
    (expiringMedicines || []).length;

  if (loading) {
    return (
      <div className={`fixed right-0 top-0 h-screen transition-all duration-300 z-50 ${isOpen ? 'w-[352px]' : 'w-0'}`}>
        <button
          onClick={onToggle}
          className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 bg-[#141a20] border border-[rgba(255,255,255,0.04)] border-r-0 text-white p-2 rounded-l-lg hover:bg-[#1a2028] transition-colors shadow-sm"
          aria-label={isOpen ? 'Collapse notifications' : 'Expand notifications'}
          title="Alerts"
        >
          {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div className={`h-full bg-[#0c1015] border-l border-[rgba(255,255,255,0.04)] w-[352px] ${isOpen ? '' : 'hidden'}`}>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4a5568]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed right-0 top-0 h-screen transition-all duration-300 z-50 ${isOpen ? 'w-[352px]' : 'w-0'}`}>
      {/* Collapse/Expand Button */}
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 bg-[#141a20] border border-[rgba(255,255,255,0.04)] border-r-0 text-white p-2 rounded-l-lg hover:bg-[#1a2028] transition-colors shadow-sm flex items-center justify-center"
        aria-label={isOpen ? 'Collapse notifications' : 'Expand notifications'}
        style={{ width: '32px', height: '48px' }}
        title="Alerts"
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <div
        className={`h-full bg-[#0c1015] border-l border-[rgba(255,255,255,0.04)] w-[352px] overflow-y-auto p-6 ${isOpen ? '' : 'hidden'}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Header */}
        <div className="bg-[#141a20] text-white p-4 rounded mb-6 flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Bell size={20} />
            <span className="font-bold text-[14.106px]">Alerts</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[14.106px] text-[rgba(255,255,255,0.75)]">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {/* Unreplied Messages */}
          {Array.isArray(unrepliedMessages) && unrepliedMessages.length > 0 && (
            <div>
              <h3 className="text-white font-medium text-sm mb-3 flex items-center">
                <MessageSquare size={16} className="mr-2 text-blue-500" />
                Unreplied Messages ({unrepliedMessages.length})
              </h3>
              {unrepliedMessages.filter(msg => msg && msg.id).map((message) => (
                <div
                  key={`message-${message.id}`}
                  className="border rounded-lg p-4 border-blue-500/15 bg-blue-500/5 border-l-4 border-l-blue-400/50 mb-3"
                >
                  <div className="flex items-start space-x-3">
                    <MessageSquare className="text-blue-500" size={16} />
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-1">
                        {message.subject}
                      </h4>
                      <p className="text-gray-300 text-xs mb-2">
                        From: {message.sender?.full_name || message.sender?.email || 'Unknown'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          {message.tag.replace('_', ' ')}
                        </span>
                        <span className="text-[rgba(255,255,255,0.5)] text-xs">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expiring Medicines */}
          {Array.isArray(expiringMedicines) && expiringMedicines.length > 0 && (
            <div>
              <h3 className="text-white font-medium text-sm mb-3 flex items-center">
                <Clock size={16} className="mr-2 text-red-500" />
                Expiring Soon ({expiringMedicines.length})
              </h3>
              {expiringMedicines.filter(med => med && med.id).map((medicine) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(medicine.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={`expiry-${medicine.id}`}
                    className="border rounded-lg p-4 border-red-500/15 bg-red-500/5 border-l-4 border-l-red-400/50 mb-3"
                  >
                    <div className="flex items-start space-x-3">
                      <Clock className="text-red-500" size={16} />
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm mb-1">
                          {medicine.name}
                        </h4>
                        <p className="text-gray-300 text-xs mb-2">
                          Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} | Qty: {medicine.quantity}
                        </p>
                        {medicine.dosage && (
                          <p className="text-gray-400 text-xs mb-2">{medicine.dosage}</p>
                        )}
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          {daysUntilExpiry <= 3 ? 'Critical' : 'Warning'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Low Stock Items */}
          {Array.isArray(lowStockItems) && lowStockItems.length > 0 && (
            <div>
              <h3 className="text-white font-medium text-sm mb-3 flex items-center">
                <Package size={16} className="mr-2 text-orange-500" />
                Low Stock Alert ({lowStockItems.length})
              </h3>
              {lowStockItems.filter(item => item && item.id).map((item) => (
                <div
                  key={`stock-${item.id}`}
                  className="border rounded-lg p-4 border-orange-500/15 bg-orange-500/5 border-l-4 border-l-orange-400/50 mb-3"
                >
                  <div className="flex items-start space-x-3">
                    <Package className="text-orange-500" size={16} />
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-1">
                        {item.name}
                      </h4>
                      <p className="text-gray-300 text-xs mb-2">
                        Current: {item.quantity} | Min: {item.min_stock_level || 10}
                      </p>
                      <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                        Restock Required
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular Notifications */}
          {Array.isArray(notifications) && notifications.length > 0 && (
            <div>
              <h3 className="text-white font-medium text-sm mb-3 flex items-center">
                <Bell size={16} className="mr-2 text-gray-400" />
                System Notifications
              </h3>
              {notifications.filter(notif => notif && notif.id).map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${getNotificationColor(notification.type)} ${!notification.is_read ? 'border-l-4 border-l-blue-400/50' : ''
                    } mb-3`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-white font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-300 hover:text-white"
                              title="Mark as read"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>

                        <p className="text-gray-300 text-xs mb-2">
                          {notification.message}
                        </p>

                        <div className="text-[rgba(255,255,255,0.5)] text-xs">
                          {formatDate(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {(!notifications || notifications.length === 0) &&
            (!unrepliedMessages || unrepliedMessages.length === 0) &&
            (!lowStockItems || lowStockItems.length === 0) &&
            (!expiringMedicines || expiringMedicines.length === 0) &&
            !loading && (
              <div className="text-center py-8">
                <Bell className="mx-auto text-gray-500 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No notifications yet</p>
              </div>
            )}
        </div>

        {/* Quick Actions */}
        {Array.isArray(notifications) && notifications.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <button
              onClick={() => {
                try {
                  // Mark all as read
                  notifications.forEach(notification => {
                    if (notification && !notification.is_read && notification.id) {
                      markAsRead(notification.id);
                    }
                  });
                } catch (error) {
                  console.error('Error marking all as read:', error);
                }
              }}
              className="w-full text-blue-300 text-sm hover:underline"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}