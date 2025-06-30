import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, RefreshCw, Star } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";

interface SearchResult {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium: string;
  };
  averageScore: number;
  episodes: number;
  status: string;
  seasonYear: number;
}

interface CustomAnimeProps {}

const CustomAnime: React.FC<CustomAnimeProps> = () => {
  const [customList, setCustomList] = useState<SearchResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { startEpisodeChecking, stopEpisodeChecking } = useNotifications();

  // Load custom list
  useEffect(() => {
    try {
      const savedList = localStorage.getItem("nyanbar-custom-anime-list");
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        if (Array.isArray(parsedList)) {
          setCustomList(parsedList);
        }
      }
    } catch (error) {
      console.error("Error loading custom list:", error);
    }
  }, []);

  // Start episode checking when component mounts
  useEffect(() => {
    if (customList.length > 0) {
      startEpisodeChecking(customList);
    }

    return () => {
      stopEpisodeChecking();
    };
  }, [customList, startEpisodeChecking, stopEpisodeChecking]);

  const removeFromCustomList = (animeId: number) => {
    const newList = customList.filter((item) => item.id !== animeId);
    setCustomList(newList);
    localStorage.setItem("nyanbar-custom-anime-list", JSON.stringify(newList));
  };

  const manualCheckForNewEpisodes = async () => {
    if (customList.length === 0) return;

    setIsChecking(true);
    try {
      // The notification system will handle the checking and notifications
      startEpisodeChecking(customList);
      setLastChecked(new Date());
    } catch (error) {
      console.error("Error checking for new episodes:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatLastChecked = () => {
    if (!lastChecked) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastChecked.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastChecked.toLocaleDateString();
  };

  if (customList.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Your anime list is empty
          </h2>
          <p className="text-gray-400 mb-6">
            Start building your collection by searching for anime and adding
            them to your list.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Search Anime
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Anime List</h1>
          <p className="text-gray-400">
            {customList.length} anime in your collection
          </p>
        </div>

        {/* Episode Check Controls */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Last checked: {formatLastChecked()}
          </div>
          <button
            onClick={manualCheckForNewEpisodes}
            disabled={isChecking || customList.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-dark-700 hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${isChecking ? "animate-spin" : ""}`}
            />
            {isChecking ? "Checking..." : "Check for New Episodes"}
          </button>
        </div>
      </div>

      {/* Anime Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {customList.map((anime) => (
          <div key={anime.id} className="group relative anime-card h-full">
            <Link to={`/anime/${anime.id}`} className="block h-full">
              <div className="card overflow-hidden h-full flex flex-col">
                <div className="relative aspect-[2/3] bg-slate-700 overflow-hidden flex-shrink-0">
                  <img
                    src={
                      anime.coverImage.extraLarge ||
                      anime.coverImage.large ||
                      anime.coverImage.medium
                    }
                    alt={anime.title.english || anime.title.romaji}
                    className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (
                        target.src !== anime.coverImage.large &&
                        anime.coverImage.large
                      ) {
                        target.src = anime.coverImage.large;
                      } else if (
                        target.src !== anime.coverImage.medium &&
                        anime.coverImage.medium
                      ) {
                        target.src = anime.coverImage.medium;
                      } else {
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23374151'/%3E%3Ctext x='150' y='200' text-anchor='middle' fill='white' font-family='Arial' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-white">
                          {anime.averageScore
                            ? `${anime.averageScore / 10}/10`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300">
                        {anime.episodes
                          ? `${anime.episodes} episodes`
                          : "Unknown episodes"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col min-h-0">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white group-hover:text-emerald-300 transition-colors duration-150">
                    {anime.title.english || anime.title.romaji}
                  </h3>
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{anime.status.replace(/_/g, " ")}</span>
                      {anime.seasonYear && <span>{anime.seasonYear}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Remove from Custom List Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFromCustomList(anime.id);
              }}
              className="absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all duration-150 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm bg-red-600/70 text-white hover:bg-red-700/80 animate-toggle-scale"
              title="Remove from custom list"
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="text-lg font-bold">✕</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomAnime;
