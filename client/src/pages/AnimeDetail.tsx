import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Star,
  Calendar,
  Download,
  ExternalLink,
  ArrowLeft,
  Plus,
} from "lucide-react";

interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  description: string;
  episodes: number;
  duration: number;
  status: string;
  season: string;
  seasonYear: number;
  genres: string[];
  averageScore: number;
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium: string;
  };
  bannerImage: string;
  format: string;
  source: string;
  studios: {
    nodes: Array<{
      name: string;
      siteUrl: string;
    }>;
  };
  characters: {
    nodes: Array<{
      name: {
        full: string;
      };
      image: {
        large: string;
      };
    }>;
  };
}

interface Torrent {
  title: string;
  size: string;
  date: string;
  seeds: number;
  leeches: number;
  downloadUrl: string;
  magnetUrl: string | null;
}

interface AnimeDetailProps {}

const AnimeDetail: React.FC<AnimeDetailProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [customList, setCustomList] = useState<Anime[]>([]);
  const [isInCustomList, setIsInCustomList] = useState(false);
  const [torrentSort, setTorrentSort] = useState("default");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [animeLoading, setAnimeLoading] = useState(true);
  const [torrentsLoading, setTorrentsLoading] = useState(true);

  // Function to clean title by removing year and extra spaces
  const cleanTitle = (title: string): string => {
    // Remove year patterns (4 digits at the end or beginning)
    let cleaned = title.replace(/\s+\d{4}$/, ""); // Remove year at end
    cleaned = cleaned.replace(/^\d{4}\s+/, ""); // Remove year at beginning
    cleaned = cleaned.replace(/\s+\(\d{4}\)/, ""); // Remove year in parentheses
    cleaned = cleaned.replace(/\s+\[\d{4}\]/, ""); // Remove year in brackets

    // Normalize spaces and trim
    return cleaned.replace(/\s+/g, " ").trim();
  };

  // Function to fetch torrents for a specific episode
  const fetchTorrentsForEpisode = async (
    episode: string,
    animeTitle?: string
  ) => {
    setTorrentsLoading(true);
    try {
      const title = animeTitle;
      if (!title) {
        setTorrents([]);
        setTorrentsLoading(false);
        return;
      }
      const response = await axios.get(
        `/api/torrents/${encodeURIComponent(title)}?episode=${episode}`
      );
      const torrentsData = response.data;
      setTorrents(torrentsData);
    } catch (error) {
      setTorrents([]);
    } finally {
      setTorrentsLoading(false);
    }
  };

  useEffect(() => {
    const fetchAnime = async () => {
      if (!id) return;
      setAnimeLoading(true);
      setTorrentsLoading(true);
      setError("");
      try {
        const response = await axios.get(`/api/anime/${id}`);
        const animeData = response.data;
        setAnime(animeData);
        setAnimeLoading(false);
        // Check if there's an episode parameter in the URL (from notification)
        const episodeParam = searchParams.get("episode");
        if (episodeParam) {
          setSelectedEpisode(episodeParam);
          setTimeout(() => {
            const torrentsSection = document.querySelector(
              "[data-torrents-section]"
            );
            if (torrentsSection) {
              torrentsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 500);
        }
        // First fetch all torrents to determine the latest available episode
        const title =
          animeData.title.english ||
          animeData.title.romaji ||
          animeData.title.native;
        // Clean the title by removing year
        const cleanAnimeTitle = cleanTitle(title);
        // Use cleaned title for search - no variations
        const searchTerm = cleanAnimeTitle;
        try {
          // Fetch all torrents with cleaned title
          const torrentsResponse = await axios.get(
            `/api/torrents/${encodeURIComponent(searchTerm)}?episode=all`
          );
          const allTorrentsData = torrentsResponse.data;
          // Find the latest episode that has torrents available
          let latestEpisode = 0;
          if (allTorrentsData.length > 0) {
            const episodeNumbers = allTorrentsData
              .map((torrent: any) => {
                const title = torrent.title.toLowerCase();
                // More precise episode pattern matching
                // Look for patterns like "ep01", "episode 01", "e01", etc.
                // But avoid matching numbers that are clearly not episode numbers
                const epMatch = title.match(/(?:ep|episode|e)\s*(\d{1,3})/i);
                if (epMatch) {
                  const episodeNum = parseInt(epMatch[1]);
                  // Only consider reasonable episode numbers (1-999)
                  if (episodeNum >= 1 && episodeNum <= 999) {
                    return episodeNum;
                  }
                }
                return 0;
              })
              .filter((ep: number) => ep > 0);
            if (episodeNumbers.length > 0) {
              // Sort and get the most common episode numbers
              const episodeCounts = episodeNumbers.reduce(
                (acc: Record<number, number>, ep: number) => {
                  acc[ep] = (acc[ep] || 0) + 1;
                  return acc;
                },
                {} as Record<number, number>
              );
              // Get the episode with the most occurrences (most likely to be correct)
              const sortedEpisodes = Object.entries(episodeCounts)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([ep]) => parseInt(ep));
              latestEpisode = sortedEpisodes[0] || Math.max(...episodeNumbers);
            }
          }
          // Set the selected episode - prioritize URL parameter, then latest episode
          if (episodeParam) {
            // If episode param exists, fetch torrents for that specific episode
            await fetchTorrentsForEpisode(episodeParam, searchTerm);
          } else if (latestEpisode > 0) {
            setSelectedEpisode(latestEpisode.toString());
            // Fetch torrents for the latest episode
            await fetchTorrentsForEpisode(latestEpisode.toString(), searchTerm);
          } else {
            // If no episodes found, default to "all"
            setSelectedEpisode("all");
            setTorrents(allTorrentsData);
          }
          setTorrentsLoading(false);
        } catch (torrentError) {
          // Default to "all" episodes if torrent fetch fails
          if (!episodeParam) {
            setSelectedEpisode("all");
          }
          await fetchTorrentsForEpisode(episodeParam || "all", searchTerm);
          setTorrentsLoading(false);
        }
      } catch (error: any) {
        setError(
          error.response?.data?.message ||
            "Failed to fetch anime details. Please try again."
        );
        setAnimeLoading(false);
        setTorrentsLoading(false);
      }
    };
    fetchAnime();
  }, [id, searchParams]);

  // Load custom list and check if current anime is in it
  useEffect(() => {
    try {
      const savedList = localStorage.getItem("nyanbar-custom-anime-list");
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        if (Array.isArray(parsedList)) {
          setCustomList(parsedList);
          if (anime) {
            setIsInCustomList(parsedList.some((item) => item.id === anime.id));
          }
        }
      }
    } catch (error) {
      console.error("Error loading custom list:", error);
    }
  }, [anime]);

  const addToCustomList = () => {
    if (!anime) return;

    const isAlreadyInList = customList.some((item) => item.id === anime.id);
    if (isAlreadyInList) {
      // Remove from list
      const newList = customList.filter((item) => item.id !== anime.id);
      setCustomList(newList);
      setIsInCustomList(false);
      localStorage.setItem(
        "nyanbar-custom-anime-list",
        JSON.stringify(newList)
      );
    } else {
      // Add to list
      const newList = [...customList, anime];
      setCustomList(newList);
      setIsInCustomList(true);
      localStorage.setItem(
        "nyanbar-custom-anime-list",
        JSON.stringify(newList)
      );
    }
  };

  const handleEpisodeChange = (episode: string) => {
    setSelectedEpisode(episode);

    // Use the same search term logic as the initial fetch - with cleaned title
    let searchTerm =
      anime?.title.english || anime?.title.romaji || anime?.title.native;

    // Clean the title by removing year
    if (searchTerm) {
      searchTerm = cleanTitle(searchTerm);
    }

    fetchTorrentsForEpisode(episode, searchTerm);
  };

  const formatDescription = (description: string) => {
    return description.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "");
  };

  const generateEpisodeOptions = (totalEpisodes: number) => {
    const options = [];

    for (let i = 1; i <= totalEpisodes; i++) {
      const episodeFormatted = i.toString().padStart(2, "0");
      options.push({
        value: i.toString(),
        label: `Episode ${episodeFormatted} (EP${episodeFormatted})`,
      });
    }

    // Add "All Episodes" option at the end
    options.push({ value: "all", label: "All Episodes" });

    return options;
  };

  // Simple inline component for torrent section
  const TorrentSection = ({
    torrents,
    loading,
    selectedEpisode,
    qualityFilter,
    torrentSort,
    onEpisodeChange,
    onQualityFilterChange,
    onTorrentSortChange,
    episodeOptions,
  }: {
    torrents: any[];
    loading: boolean;
    selectedEpisode: string;
    qualityFilter: string;
    torrentSort: string;
    onEpisodeChange: (episode: string) => void;
    onQualityFilterChange: (filter: string) => void;
    onTorrentSortChange: (sort: string) => void;
    episodeOptions: any[];
  }) => {
    // Parse size string to bytes for comparison
    const parseSize = (sizeStr: string) => {
      const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)$/i);
      if (!match) return 0;
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      const units = { KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
      return value * (units[unit as keyof typeof units] || 1);
    };

    // Get quality priority for sorting (higher number = higher priority)
    const getQualityPriority = (title: string) => {
      const lowerTitle = title.toLowerCase();

      // 4K quality (highest priority)
      if (
        lowerTitle.includes("4k") ||
        lowerTitle.includes("2160p") ||
        lowerTitle.includes("uhd")
      ) {
        return 4;
      }

      // 1080p quality (high priority)
      if (lowerTitle.includes("1080p") || lowerTitle.includes("fhd")) {
        return 3;
      }

      // 720p quality (medium priority)
      if (lowerTitle.includes("720p") || lowerTitle.includes("hd")) {
        return 2;
      }

      // 480p or lower quality (lowest priority)
      if (
        lowerTitle.includes("480p") ||
        lowerTitle.includes("360p") ||
        lowerTitle.includes("240p")
      ) {
        return 1;
      }

      // Unknown quality (default priority) - treat as medium quality
      return 2;
    };

    // Get quality label for display
    const getQualityLabel = (title: string) => {
      const lowerTitle = title.toLowerCase();

      if (
        lowerTitle.includes("4k") ||
        lowerTitle.includes("2160p") ||
        lowerTitle.includes("uhd")
      ) {
        return {
          label: "4K",
          color: "bg-purple-600",
          textColor: "text-white",
        };
      }

      if (lowerTitle.includes("1080p") || lowerTitle.includes("fhd")) {
        return {
          label: "1080p",
          color: "bg-blue-600",
          textColor: "text-white",
        };
      }

      if (lowerTitle.includes("720p") || lowerTitle.includes("hd")) {
        return {
          label: "720p",
          color: "bg-green-600",
          textColor: "text-white",
        };
      }

      if (lowerTitle.includes("480p")) {
        return {
          label: "480p",
          color: "bg-yellow-600",
          textColor: "text-black",
        };
      }

      if (lowerTitle.includes("360p") || lowerTitle.includes("240p")) {
        return { label: "SD", color: "bg-gray-600", textColor: "text-white" };
      }

      // Default to HD if no specific quality is found
      return { label: "HD", color: "bg-green-600", textColor: "text-white" };
    };

    // Sort torrents based on selected option
    let sortedTorrents = [...torrents];

    // Apply quality filter first
    if (qualityFilter !== "all") {
      sortedTorrents = sortedTorrents.filter((torrent) => {
        const quality = getQualityPriority(torrent.title);

        switch (qualityFilter) {
          case "4k":
            return quality === 4;
          case "1080p":
            return quality === 3;
          case "720p":
            return quality === 2;
          case "sd":
            return quality === 1;
          default:
            return true;
        }
      });
    }

    if (torrentSort === "seeders") {
      sortedTorrents.sort((a, b) => b.seeds - a.seeds);
    } else if (torrentSort === "size-desc") {
      sortedTorrents.sort((a, b) => parseSize(b.size) - parseSize(a.size));
    } else if (torrentSort === "size-asc") {
      sortedTorrents.sort((a, b) => parseSize(a.size) - parseSize(b.size));
    }

    // Always apply quality priority sorting (4K and 1080p first)
    sortedTorrents.sort((a, b) => {
      const qualityA = getQualityPriority(a.title);
      const qualityB = getQualityPriority(b.title);

      // If quality is different, sort by quality (higher first)
      if (qualityA !== qualityB) {
        return qualityB - qualityA;
      }

      // If quality is the same, maintain the original sort order
      return 0;
    });

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Episode Selection and Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">
              Episode:
            </label>
            <select
              value={selectedEpisode}
              onChange={(e) => onEpisodeChange(e.target.value)}
              className="bg-dark-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {episodeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">
              Quality:
            </label>
            <select
              value={qualityFilter}
              onChange={(e) => onQualityFilterChange(e.target.value)}
              className="bg-dark-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Qualities</option>
              <option value="4k">4K</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="sd">SD</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">
              Sort by:
            </label>
            <select
              value={torrentSort}
              onChange={(e) => onTorrentSortChange(e.target.value)}
              className="bg-dark-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="default">Default</option>
              <option value="seeders">Most Seeders</option>
              <option value="size-desc">Largest Size</option>
              <option value="size-asc">Smallest Size</option>
            </select>
          </div>
        </div>

        {/* Torrent List */}
        {sortedTorrents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No torrents found for this episode.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTorrents.map((torrent, index) => {
              const quality = getQualityLabel(torrent.title);
              return (
                <div
                  key={index}
                  className="bg-dark-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${quality.color} ${quality.textColor}`}
                        >
                          {quality.label}
                        </span>
                        <span className="text-sm text-gray-400">
                          {torrent.size}
                        </span>
                      </div>
                      <h3 className="text-white font-medium mb-2 line-clamp-2">
                        {torrent.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>📅 {torrent.date}</span>
                        <span>🌱 {torrent.seeds}</span>
                        <span>🔗 {torrent.leeches}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {torrent.magnetUrl && (
                        <a
                          href={torrent.magnetUrl}
                          className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download size={16} />
                          <span>Magnet</span>
                        </a>
                      )}
                      <a
                        href={torrent.downloadUrl}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={16} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (animeLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-600 text-white px-6 py-4 rounded-lg inline-block">
          {error}
        </div>
        <Link to="/" className="btn-primary mt-4 inline-block">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">Anime not found</div>
        <Link to="/" className="btn-primary mt-4 inline-block">
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-white hover:text-gray-300 transition-colors animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Home
      </Link>

      {/* Anime Details */}
      <div className="card p-4 sm:p-6 mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center sm:text-left">
          Anime Details
        </h3>

        <div className="space-y-6 sm:space-y-8">
          {/* Anime Details */}
          <div className="card p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              {/* Cover Image */}
              <div className="flex-shrink-0 flex justify-center lg:justify-start">
                <img
                  src={
                    anime.coverImage.extraLarge ||
                    anime.coverImage.large ||
                    anime.coverImage.medium
                  }
                  alt={anime.title.english || anime.title.romaji}
                  className="w-48 sm:w-64 h-72 sm:h-96 object-cover rounded-lg bg-dark-700 shadow-lg"
                  loading="lazy"
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
                        "https://via.placeholder.com/256x384/374151/FFFFFF?text=No+Image";
                    }
                  }}
                />
              </div>

              {/* Anime Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-2 justify-center lg:justify-start">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {anime.title.english || anime.title.romaji}
                  </h2>
                  <button
                    onClick={addToCustomList}
                    className={`p-3 sm:p-2 rounded-full transition-all duration-150 self-center sm:self-auto focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm ${
                      isInCustomList
                        ? "bg-red-600/70 text-white hover:bg-red-700/80 animate-toggle-scale"
                        : "bg-dark-700 text-white hover:bg-primary-600 hover:scale-110 animate-toggle-scale"
                    }`}
                    title={
                      isInCustomList
                        ? "Remove from custom list"
                        : "Add to custom list"
                    }
                    style={{
                      width: 40,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isInCustomList ? (
                      <span className="text-lg font-bold">✕</span>
                    ) : (
                      <Plus size={24} className="sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                {anime.title.native && (
                  <p className="text-gray-400 text-base sm:text-lg mb-4">
                    {anime.title.native}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 justify-center lg:justify-start">
                  {anime.averageScore && (
                    <div className="flex items-center space-x-1 bg-dark-700/50 px-3 py-1 rounded-full">
                      <Star
                        className="text-yellow-500 fill-current"
                        size={14}
                      />
                      <span className="text-white text-sm">
                        {(anime.averageScore / 10).toFixed(1)}
                      </span>
                    </div>
                  )}
                  {anime.episodes && (
                    <div className="flex items-center space-x-1 bg-dark-700/50 px-3 py-1 rounded-full">
                      <span className="text-gray-400 text-sm">Episodes:</span>
                      <span className="text-white text-sm">
                        {anime.episodes}
                      </span>
                    </div>
                  )}
                  {anime.duration && (
                    <div className="flex items-center space-x-1 bg-dark-700/50 px-3 py-1 rounded-full">
                      <span className="text-gray-400 text-sm">Duration:</span>
                      <span className="text-white text-sm">
                        {anime.duration} min
                      </span>
                    </div>
                  )}
                  {anime.seasonYear && (
                    <div className="flex items-center space-x-1 bg-dark-700/50 px-3 py-1 rounded-full">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-white text-sm">
                        {anime.seasonYear}
                      </span>
                    </div>
                  )}
                </div>

                {anime.genres && anime.genres.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {anime.genres.map((genre) => (
                        <span
                          key={genre}
                          className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {anime.description && (
                  <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Description
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                      {formatDescription(anime.description)}
                    </p>
                  </div>
                )}

                {anime.studios && anime.studios.nodes.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                      Studios
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      {anime.studios.nodes.map((studio) => (
                        <span
                          key={studio.name}
                          className="bg-dark-700 text-white px-3 py-1 rounded-lg text-xs sm:text-sm"
                        >
                          {studio.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Characters Section */}
      {anime.characters && anime.characters.nodes.length > 0 && (
        <div className="card p-4 sm:p-6 mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 text-center sm:text-left">
            Characters
          </h3>
          <div className="flex-1">
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {anime.characters.nodes.slice(0, 12).map((character, index) => (
                <div key={index} className="text-center">
                  <img
                    src={character.image.large}
                    alt={character.name.full}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 object-cover bg-dark-700 shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://via.placeholder.com/64x64/374151/FFFFFF?text=?";
                    }}
                  />
                  <p className="text-xs sm:text-sm text-white font-medium truncate px-1">
                    {character.name.full}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Torrents Section */}
      {(() => {
        return (
          <div className="card p-6 mb-8" data-torrents-section>
            <h3 className="text-xl font-bold text-white mb-4 flex flex-col sm:flex-row sm:items-center">
              <div className="flex items-center mb-2 sm:mb-0">
                <Download className="mr-2" size={20} />
                Available Downloads ({torrents.length})
              </div>
            </h3>
            <div className="flex-1">
              {torrentsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : (
                <TorrentSection
                  torrents={torrents}
                  loading={torrentsLoading}
                  selectedEpisode={selectedEpisode}
                  qualityFilter={qualityFilter}
                  torrentSort={torrentSort}
                  onEpisodeChange={handleEpisodeChange}
                  onQualityFilterChange={setQualityFilter}
                  onTorrentSortChange={setTorrentSort}
                  episodeOptions={generateEpisodeOptions(anime.episodes || 0)}
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AnimeDetail;
