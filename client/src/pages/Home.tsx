import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import AnimeCard from "../components/AnimeCard";
import { TrendingUp, Star, Lightbulb } from "lucide-react";

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

const animeFacts = [
  "The word 'anime' comes from the English word 'animation' and is used in Japan to refer to all animated works.",
  "Studio Ghibli's 'Spirited Away' was the first anime to win an Academy Award for Best Animated Feature.",
  "The first anime series, 'Astro Boy', was created by Osamu Tezuka in 1963.",
  "Anime is watched by people of all ages in Japan, not just children.",
  "The longest-running anime series is 'Sazae-san', which has been airing since 1969.",
  "Many anime are based on manga (Japanese comics) that are published weekly or monthly.",
  "The anime industry in Japan is worth over $20 billion annually.",
  "Anime has influenced Western animation and filmmaking significantly.",
];

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Home: React.FC = () => {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [popular, setPopular] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [customList, setCustomList] = useState<Anime[]>([]);
  const [randomFact, setRandomFact] = useState("");

  // Memoized custom list check for better performance
  const customListSet = useMemo(
    () => new Set(customList.map((item) => item.id)),
    [customList]
  );

  const fetchWithCache = async (url: string) => {
    const now = Date.now();
    const cached = apiCache.get(url);

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const response = await axios.get(url);
    apiCache.set(url, { data: response.data, timestamp: now });
    return response.data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data with caching
        const [trendingData, popularData] = await Promise.all([
          fetchWithCache("/api/trending"),
          fetchWithCache("/api/popular"),
        ]);

        setTrending(trendingData);
        setPopular(popularData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set random fact on component mount
  useEffect(() => {
    const fact = animeFacts[Math.floor(Math.random() * animeFacts.length)];
    setRandomFact(fact);
  }, []);

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
    const isAlreadyInList = customListSet.has(anime.id);
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
    return customListSet.has(animeId);
  };

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        {/* Loading skeleton for fact section */}
        <div className="card p-4 sm:p-6 loading-shimmer">
          <div className="flex items-center space-x-3 mb-3 sm:mb-4">
            <div className="w-5 h-5 loading-pulse rounded"></div>
            <div className="h-6 loading-pulse rounded w-32"></div>
          </div>
          <div className="h-6 loading-pulse rounded w-full"></div>
        </div>

        {/* Loading skeleton for trending section */}
        <section>
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="w-5 h-5 loading-pulse rounded"></div>
            <div className="h-7 loading-pulse rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-3 h-full">
                <div className="aspect-[2/3] loading-pulse rounded-lg"></div>
                <div className="h-4 loading-pulse rounded"></div>
                <div className="h-3 loading-pulse rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Loading skeleton for popular section */}
        <section>
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="w-5 h-5 loading-pulse rounded"></div>
            <div className="h-7 loading-pulse rounded w-32"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-3 h-full">
                <div className="aspect-[2/3] loading-pulse rounded-lg"></div>
                <div className="h-4 loading-pulse rounded"></div>
                <div className="h-3 loading-pulse rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Random Anime Fact Section */}
      <div className="card p-4 sm:p-6 stagger-animation animation-delay-100">
        <div className="flex items-center space-x-3 mb-3 sm:mb-4">
          <Lightbulb className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Random Anime Fact
          </h2>
        </div>
        <p className="text-gray-300 leading-relaxed">{randomFact}</p>
      </div>

      {/* Trending Anime Section */}
      <section className="stagger-animation animation-delay-200">
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Trending Now
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {trending.map((anime, index) => (
            <div
              key={anime.id}
              className="animate-fade-in h-full"
              style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
            >
              <AnimeCard
                anime={anime}
                onAddToCustomList={addToCustomList}
                isInCustomList={isInCustomList(anime.id)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Popular Anime Section */}
      <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center space-x-2 mb-4 sm:mb-6">
          <Star className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Popular Anime
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {popular.map((anime, index) => (
            <div
              key={anime.id}
              className="animate-fade-in h-full"
              style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
            >
              <AnimeCard
                anime={anime}
                onAddToCustomList={addToCustomList}
                isInCustomList={isInCustomList(anime.id)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
