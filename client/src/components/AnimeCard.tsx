import React from "react";
import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";

interface AnimeCardProps {
  anime: {
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
  };
  onAddToCustomList?: (anime: AnimeCardProps["anime"]) => void;
  isInCustomList?: boolean;
}

const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  onAddToCustomList,
  isInCustomList = false,
}) => {
  const title = anime.title.english || anime.title.romaji || anime.title.native;
  const imageUrl =
    anime.coverImage.extraLarge ||
    anime.coverImage.large ||
    anime.coverImage.medium;

  return (
    <div className="group relative anime-card h-full">
      <Link to={`/anime/${anime.id}`} className="block h-full">
        <div className="card overflow-hidden h-full flex flex-col">
          <div className="relative aspect-[2/3] bg-slate-700 overflow-hidden flex-shrink-0">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-110"
              loading="lazy"
              decoding="async"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
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
              {title}
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

      {/* Add to Custom List Button */}
      {onAddToCustomList && (
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToCustomList(anime);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all duration-150 transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 backdrop-blur-sm ${
            isInCustomList
              ? "bg-red-600/70 text-white hover:bg-red-700/80 animate-toggle-scale"
              : "bg-slate-800/80 text-emerald-400 hover:bg-emerald-600 hover:text-white animate-toggle-scale"
          }`}
          title={
            isInCustomList ? "Remove from custom list" : "Add to custom list"
          }
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isInCustomList ? (
            <span className="text-lg font-bold">✕</span>
          ) : (
            <Plus size={20} />
          )}
        </button>
      )}
    </div>
  );
};

export default AnimeCard;
