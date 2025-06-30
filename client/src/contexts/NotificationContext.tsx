import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import EpisodeChecker from "../services/episodeChecker";

interface NewEpisodeNotification {
  id: string;
  animeId: number;
  animeTitle: string;
  episode: number;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: NewEpisodeNotification[];
  unreadCount: number;
  addNotification: (
    animeId: number,
    animeTitle: string,
    episode: number
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  startEpisodeChecking: (customList: any[]) => void;
  stopEpisodeChecking: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NewEpisodeNotification[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const episodeCheckerRef = useRef<EpisodeChecker | null>(null);

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem(
      "nyanbar-episode-notifications"
    );
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          setUnreadCount(parsed.filter((n) => !n.read).length);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    }
  }, []);

  // Add new notification
  const addNotification = useCallback(
    (animeId: number, animeTitle: string, episode: number) => {
      const newNotification: NewEpisodeNotification = {
        id: `${animeId}-${episode}-${Date.now()}`,
        animeId,
        animeTitle,
        episode,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => {
        const updatedNotifications = [newNotification, ...prev];
        setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
        localStorage.setItem(
          "nyanbar-episode-notifications",
          JSON.stringify(updatedNotifications)
        );
        return updatedNotifications;
      });

      // Show browser notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`New Episode Available!`, {
          body: `${animeTitle} Episode ${episode} is now available for download`,
          icon: "/favicon.ico",
          tag: newNotification.id,
        });
      }
    },
    []
  );

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
      localStorage.setItem(
        "nyanbar-episode-notifications",
        JSON.stringify(updatedNotifications)
      );
      return updatedNotifications;
    });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((n) => ({ ...n, read: true }));
      setUnreadCount(0);
      localStorage.setItem(
        "nyanbar-episode-notifications",
        JSON.stringify(updatedNotifications)
      );
      return updatedNotifications;
    });
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updatedNotifications = prev.filter((n) => n.id !== notificationId);
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
      localStorage.setItem(
        "nyanbar-episode-notifications",
        JSON.stringify(updatedNotifications)
      );
      return updatedNotifications;
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem("nyanbar-episode-notifications", JSON.stringify([]));
  }, []);

  // Start episode checking
  const startEpisodeChecking = useCallback(
    (customList: any[]) => {
      if (customList.length === 0) return;

      // Stop any existing checking first
      if (episodeCheckerRef.current) {
        episodeCheckerRef.current.stopPeriodicChecking();
      }

      const episodeChecker = EpisodeChecker.getInstance();
      episodeCheckerRef.current = episodeChecker;

      // Override the checkAllAnimeForNewEpisodes method to add notifications
      const originalCheck =
        episodeChecker.checkAllAnimeForNewEpisodes.bind(episodeChecker);
      episodeChecker.checkAllAnimeForNewEpisodes = async (list: any[]) => {
        const results = await originalCheck(list);

        // Add notifications for new episodes
        results.forEach((result) => {
          addNotification(
            result.animeId,
            result.animeTitle,
            result.latestEpisode
          );
        });

        return results;
      };

      episodeChecker.startPeriodicChecking(customList, 30); // Check every 30 minutes
    },
    [addNotification]
  );

  // Stop episode checking
  const stopEpisodeChecking = useCallback(() => {
    if (episodeCheckerRef.current) {
      episodeCheckerRef.current.stopPeriodicChecking();
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    startEpisodeChecking,
    stopEpisodeChecking,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
