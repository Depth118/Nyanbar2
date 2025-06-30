import React, { useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { Link } from "react-router-dom";

interface NotificationSystemProps {
  customList: any[];
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  customList,
}) => {
  const { unreadCount } = useNotifications();

  // Disable automatic background checking - only check when user requests it
  // useEffect(() => {
  //   if (customList.length > 0) {
  //     startEpisodeChecking(customList);
  //   }

  //   return () => {
  //     stopEpisodeChecking();
  //   };
  // }, [customList, startEpisodeChecking, stopEpisodeChecking]);

  return (
    <>
      {/* Desktop Notification Button */}
      <Link
        to="/notifications"
        className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-gray-300 hover:text-white hover:bg-gray-700/50 relative"
      >
        <Bell size={20} />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      {/* Mobile Notification Button */}
      <Link
        to="/notifications"
        className="md:hidden flex items-center space-x-4 px-4 py-4 rounded-lg transition-all duration-200 text-lg text-gray-300 hover:text-white hover:bg-gray-700/50 relative w-full"
      >
        <Bell size={24} />
        <span className="font-medium">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-3 right-4 bg-red-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center shadow-lg font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </>
  );
};

export default NotificationSystem;
