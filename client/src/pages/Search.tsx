import React, { useState, useEffect } from "react";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import { Search as SearchIcon, X } from "lucide-react";

interface Anime {
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

const Search: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customList, setCustomList] = useState<Anime[]>([]);

  const apiBase = process.env.REACT_APP_API_URL || "";

  // Load custom list from localStorage
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

  const addToCustomList = (anime: Anime) => {
    const isAlreadyInList = customList.some((item) => item.id === anime.id);
    if (isAlreadyInList) {
      // Remove from list
      const newList = customList.filter((item) => item.id !== anime.id);
      setCustomList(newList);
      localStorage.setItem(
        "nyanbar-custom-anime-list",
        JSON.stringify(newList)
      );
    } else {
      // Add to list
      const newList = [...customList, anime];
      setCustomList(newList);
      localStorage.setItem(
        "nyanbar-custom-anime-list",
        JSON.stringify(newList)
      );
    }
  };

  const isInCustomList = (animeId: number) => {
    return customList.some((item) => item.id === animeId);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/api/search?query=${encodeURIComponent(query)}`
      );
      setResults(response.data);
      setSearched(true);
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
          Search Anime
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Find your favorite anime by title
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row max-w-2xl mx-auto gap-3 sm:gap-0">
          <div className="relative flex-1">
            <SearchIcon
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anime..."
              className="input-field w-full pl-12 pr-12 h-12 sm:h-auto"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary h-12 sm:h-auto sm:ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Search Results
            </h2>
            <span className="text-gray-400 text-sm sm:text-base">
              {results.length} {results.length === 1 ? "result" : "results"}{" "}
              found
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
              {results.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onAddToCustomList={addToCustomList}
                  isInCustomList={isInCustomList(anime.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">No anime found</div>
              <p className="text-gray-500 text-sm sm:text-base">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
