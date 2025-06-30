import axios from "axios";

interface EpisodeCheckResult {
  animeId: number;
  animeTitle: string;
  currentEpisode: number;
  latestEpisode: number;
  hasNewEpisode: boolean;
}

interface StoredEpisodeData {
  animeId: number;
  lastCheckedEpisode: number;
  lastCheckedTime: number;
}

class EpisodeChecker {
  private static instance: EpisodeChecker;
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {}

  static getInstance(): EpisodeChecker {
    if (!EpisodeChecker.instance) {
      EpisodeChecker.instance = new EpisodeChecker();
    }
    return EpisodeChecker.instance;
  }

  // Get stored episode data for an anime
  private getStoredEpisodeData(animeId: number): StoredEpisodeData | null {
    try {
      const stored = localStorage.getItem(`nyanbar-episode-${animeId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error getting stored episode data:", error);
      return null;
    }
  }

  // Store episode data for an anime
  private storeEpisodeData(animeId: number, episode: number): void {
    try {
      const data: StoredEpisodeData = {
        animeId,
        lastCheckedEpisode: episode,
        lastCheckedTime: Date.now(),
      };
      localStorage.setItem(`nyanbar-episode-${animeId}`, JSON.stringify(data));
    } catch (error) {
      console.error("Error storing episode data:", error);
    }
  }

  // Check for new episodes for a single anime
  async checkAnimeForNewEpisodes(
    anime: any
  ): Promise<EpisodeCheckResult | null> {
    try {
      const title =
        anime.title.english || anime.title.romaji || anime.title.native;
      if (!title) return null;

      // Create search term with year and season for better results
      let searchTerm = title;
      if (anime.seasonYear) {
        searchTerm = `${searchTerm} ${anime.seasonYear}`;
      }
      if (anime.season) {
        searchTerm = `${searchTerm} ${anime.season}`;
      }

      // Get all torrents for this anime
      const response = await axios.get(
        `/api/torrents/${encodeURIComponent(searchTerm)}?episode=all`
      );
      const torrents = response.data;

      if (torrents.length === 0) {
        return null;
      }

      // Extract episode numbers from torrent titles
      const episodeNumbers = torrents
        .map((torrent: any) => {
          const title = torrent.title.toLowerCase();
          // Look for episode patterns: ep01, episode 01, e01, etc.
          const epMatch = title.match(/(?:ep|episode|e)\s*(\d+)/i);
          return epMatch ? parseInt(epMatch[1]) : 0;
        })
        .filter((ep: number) => ep > 0);

      if (episodeNumbers.length === 0) {
        return null;
      }

      const latestEpisode = Math.max(...episodeNumbers);
      const storedData = this.getStoredEpisodeData(anime.id);
      const currentEpisode = storedData?.lastCheckedEpisode || 0;

      return {
        animeId: anime.id,
        animeTitle: title,
        currentEpisode,
        latestEpisode,
        hasNewEpisode: latestEpisode > currentEpisode,
      };
    } catch (error) {
      console.error(
        `Error checking episodes for ${
          anime.title?.english || anime.title?.romaji
        }:`,
        error
      );
      return null;
    }
  }

  // Check all anime in custom list for new episodes
  async checkAllAnimeForNewEpisodes(
    customList: any[]
  ): Promise<EpisodeCheckResult[]> {
    if (this.isChecking || customList.length === 0) {
      return [];
    }

    this.isChecking = true;
    const results: EpisodeCheckResult[] = [];

    try {
      for (const anime of customList) {
        const result = await this.checkAnimeForNewEpisodes(anime);
        if (result && result.hasNewEpisode) {
          results.push(result);
          // Store the new episode data
          this.storeEpisodeData(anime.id, result.latestEpisode);
        }

        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error("Error checking for new episodes:", error);
    } finally {
      this.isChecking = false;
    }

    return results;
  }

  // Start periodic checking
  startPeriodicChecking(customList: any[], intervalMinutes: number = 30): void {
    if (this.checkInterval) {
      this.stopPeriodicChecking();
    }

    // Check immediately
    this.checkAllAnimeForNewEpisodes(customList);

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkAllAnimeForNewEpisodes(customList);
    }, intervalMinutes * 60 * 1000);
  }

  // Stop periodic checking
  stopPeriodicChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Manually check for new episodes
  async manualCheck(customList: any[]): Promise<EpisodeCheckResult[]> {
    return this.checkAllAnimeForNewEpisodes(customList);
  }

  // Update stored episode data when user watches an episode
  updateWatchedEpisode(animeId: number, episode: number): void {
    this.storeEpisodeData(animeId, episode);
  }
}

export default EpisodeChecker;
