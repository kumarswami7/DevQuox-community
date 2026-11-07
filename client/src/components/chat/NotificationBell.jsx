import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, ExternalLink, Loader2, MessageSquare, Briefcase, CheckCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store';
import { Link } from 'react-router-dom';

export const NotificationBell = ({ className = '' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // 1. Fetch initial unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        if (isMounted) {
          setUnreadCount(res.data?.count || 0);
        }
      } catch (err) {
        // Quiet failure on unread count
      }
    };

    fetchCount();

    // 2. Real-time updates via Socket.IO
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        setUnreadCount((prev) => prev + 1);
        setNotifications((prev) => [notif, ...prev.slice(0, 19)]);
      };

      const handleUnreadCount = (data) => {
        if (typeof data?.count === 'number') {
          setUnreadCount(data.count);
        }
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification', handleNewNotification);
      socket.on('notification:unread_count', handleUnreadCount);

      return () => {
        isMounted = false;
        socket.off('notification:new', handleNewNotification);
        socket.off('notification', handleNewNotification);
        socket.off('notification:unread_count', handleUnreadCount);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // 3. Fetch notifications when dropdown opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    let isMounted = true;
    setIsLoading(true);

    const loadNotifications = async () => {
      try {
        const res = await notificationService.getNotifications({ limit: 15 });
        if (isMounted) {
          const list = res.data?.notifications || res.data?.data || [];
          setNotifications(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('[NotificationBell] Load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadNotifications();
  }, [isOpen, isAuthenticated]);

  // 4. Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 5. Actions
  const handleMarkRead = async (notif) => {
    if (notif.read) return;
    try {
      await notificationService.markRead(notif._id || notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id || n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationBell] Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationBell] Mark all read error:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none text-white bg-rose-500 rounded-full shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => {
                const notifId = notif._id || notif.id;
                const isMsg = notif.type === 'message';
                const isProject = notif.type === 'project' || notif.type === 'team';

                return (
                  <div
                    key={notifId}
                    onClick={() => handleMarkRead(notif)}
                    className={`p-3.5 px-4 transition-colors flex items-start gap-3 cursor-pointer ${
                      notif.read
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                        : 'bg-primary-50/30 dark:bg-primary-950/20 hover:bg-primary-50/50'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isMsg
                          ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400'
                          : isProject
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                          : 'bg-primary-100 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
                      }`}
                    >
                      {isMsg ? <MessageSquare className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title || (isMsg ? 'New Message' : 'Project Update')}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.link && (
                        <Link
                          to={notif.link}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline mt-1.5"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>

                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 p-8 text-center">
                No notifications right now.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
