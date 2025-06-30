import React from "react";
import { Bell, X, Play, ArrowLeft, Download, RefreshCw } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { Link, useNavigate } from "react-router-dom";

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    startEpisodeChecking,
  } = useNotifications();

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read when clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to anime detail page
    navigate(`/anime/${notification.animeId}`);
  };

  const handleDownloadClick = (e: React.MouseEvent, notification: any) => {
    e.stopPropagation(); // Prevent triggering the notification click

    // Mark as read when download is clicked
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to anime detail page with episode parameter
    navigate(`/anime/${notification.animeId}?episode=${notification.episode}`);
  };

  const handleManualCheck = () => {
    // Get custom list from localStorage
    try {
      const savedList = localStorage.getItem("nyanbar-custom-anime-list");
      if (savedList) {
        const customList = JSON.parse(savedList);
        if (Array.isArray(customList) && customList.length > 0) {
          startEpisodeChecking(customList);
        }
      }
    } catch (error) {
      console.error("Error loading custom list for manual check:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Bell size={32} className="text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm rounded-full px-3 py-1 font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualCheck}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Check for New Episodes</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <Bell size={80} className="mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-white mb-4">
              No notifications
            </h2>
            <p className="text-gray-400 text-lg mb-6">
              We'll notify you when new episodes become available for anime in
              your list
            </p>
            <Link
              to="/custom"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
            >
              <span>Go to My List</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-700/30 transition-colors cursor-pointer ${
                  !notification.read ? "bg-emerald-600/10" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-emerald-600/20 rounded-full flex items-center justify-center">
                      <Play size={20} className="text-emerald-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {notification.animeTitle}
                        </h3>
                        {!notification.read && (
                          <span className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleDownloadClick(e, notification)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        >
                          <Download size={16} />
                          <span>Download EP{notification.episode}</span>
                        </button>
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-sm text-emerald-400 hover:text-emerald-300 px-3 py-1 rounded-md hover:bg-emerald-600/20 transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                          aria-label="Remove notification"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-300 text-base mb-2">
                      Episode {notification.episode} is now available for
                      download
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {formatTimeAgo(notification.timestamp)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-600/20 text-emerald-400">
                          New Episode
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {notifications.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""} total
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
