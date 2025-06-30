const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const compression = require("compression");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(compression()); // Enable gzip compression
app.use(express.json());

// Server-side cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// AniList GraphQL endpoint
const ANILIST_API = "https://graphql.anilist.co";

// Get anime by AniList ID
app.get("/api/anime/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          description
          episodes
          duration
          status
          season
          seasonYear
          genres
          averageScore
          meanScore
          popularity
          trending
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          format
          source
          hashtag
          countryOfOrigin
          isLicensed
          isAdult
          siteUrl
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          studios {
            nodes {
              name
              siteUrl
            }
          }
          characters {
            nodes {
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
    `;

    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id: parseInt(id) },
    });

    if (response.data.errors) {
      return res.status(400).json({ error: "Anime not found" });
    }

    res.json(response.data.data.Media);
  } catch (error) {
    console.error("Error fetching anime:", error);
    res.status(500).json({ error: "Failed to fetch anime data" });
  }
});

// Search anime by title
app.get("/api/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 20) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
            }
            averageScore
            episodes
            status
            seasonYear
          }
        }
      }
    `;

    const response = await axios.post(ANILIST_API, {
      query: searchQuery,
      variables: { search: query },
    });

    res.json(response.data.data.Page.media);
  } catch (error) {
    console.error("Error searching anime:", error);
    res.status(500).json({ error: "Failed to search anime" });
  }
});

// Get nyaa.si torrents for anime with episode selection
app.get("/api/torrents/:animeTitle", async (req, res) => {
  try {
    const { animeTitle } = req.params;
    const { episode } = req.query;

    // Decode the title
    const decodedTitle = decodeURIComponent(animeTitle);

    // Preferred encoder groups in order of priority
    const preferredEncoders = [
      "ASW",
      "EMBER",
      "Anime Time",
      "SubsPlease",
      "Erai-Raws",
    ];

    // Function to get encoder priority (lower number = higher priority)
    const getEncoderPriority = (title) => {
      const titleUpper = title.toUpperCase();
      for (let i = 0; i < preferredEncoders.length; i++) {
        if (titleUpper.includes(preferredEncoders[i].toUpperCase())) {
          return i; // Return priority index (0 = highest priority)
        }
      }
      return preferredEncoders.length; // Lower priority for non-preferred encoders
    };

    // Function to clean title by removing year and extra spaces
    const cleanTitle = (title) => {
      // Remove year patterns (4 digits at the end or beginning)
      let cleaned = title.replace(/\s+\d{4}$/, ""); // Remove year at end
      cleaned = cleaned.replace(/^\d{4}\s+/, ""); // Remove year at beginning
      cleaned = cleaned.replace(/\s+\(\d{4}\)/, ""); // Remove year in parentheses
      cleaned = cleaned.replace(/\s+\[\d{4}\]/, ""); // Remove year in brackets

      // Normalize spaces and trim
      return cleaned.replace(/\s+/g, " ").trim();
    };

    // Function to check if torrent title is relevant to our search
    const isRelevantTorrent = (torrentTitle, searchTitle) => {
      const torrentUpper = torrentTitle.toUpperCase();
      const searchUpper = searchTitle.toUpperCase();

      // Split search terms (handle cases like "Mono 2024")
      const searchTerms = searchUpper
        .split(/\s+/)
        .filter((term) => term.length > 0);

      // For "all episodes" searches, be much more lenient
      if (episode && episode !== "all") {
        // Specific episode search - require anime title to match AND episode number to be present
        const animeTitleMatches = searchTerms.every((term) =>
          torrentUpper.includes(term)
        );

        if (!animeTitleMatches) {
          return false;
        }

        // Check if episode number is present in torrent title
        const episodeNum = parseInt(episode);
        const episodeFormatted = episodeNum.toString().padStart(2, "0");

        // Bulletproof episode detection
        // Only accept torrents where the target episode is the ONLY episode number (unless it's a batch and the range includes the target)
        // Ignore all numbers in quality indicators
        // No loose patterns
        const qualityIndicators = [
          "10BIT",
          "1080P",
          "720P",
          "480P",
          "X265",
          "X264",
          "HEVC",
          "AAC",
          "DDP",
          "WEBRIP",
          "BLURAY",
          "HDRIP",
        ];
        const isBatch = /batch|complete|全集|全話|all episodes|volumes?/i.test(
          torrentUpper
        );
        const batchRangeRegex = /\b(\d{1,3})\s*[-~]\s*(\d{1,3})\b/;
        const rangeMatch = torrentUpper.match(batchRangeRegex);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          if (isBatch && episodeNum >= start && episodeNum <= end) {
            return true;
          } else {
            return false;
          }
        }
        // Extract all numbers that are not part of quality indicators
        const wordsInTitle = torrentUpper.split(/\s+/);
        const episodeNumbers = [];
        for (const word of wordsInTitle) {
          if (qualityIndicators.some((q) => word.includes(q))) continue;
          const match = word.match(/^\d{1,3}$/);
          if (match) episodeNumbers.push(parseInt(match[0]));
        }
        // Accept only if the only episode number is the target
        if (episodeNumbers.length === 1 && episodeNumbers[0] === episodeNum) {
          return true;
        }
        // If no episode numbers, reject
        if (episodeNumbers.length === 0) {
          return false;
        }
        // If multiple episode numbers, reject
        if (episodeNumbers.length > 1) {
          return false;
        }
        // Fallback: reject
        return false;
      } else {
        // All episodes search - be very lenient
        if (searchTerms.length <= 1) {
          // If we have 1 or fewer terms, require it to match
          return searchTerms.every((term) => torrentUpper.includes(term));
        } else {
          // If we have more than 1 term, require at least 1 to match
          const matchingTerms = searchTerms.filter((term) =>
            torrentUpper.includes(term)
          );
          return matchingTerms.length >= 1;
        }
      }
    };

    console.log("Torrent search for:", decodedTitle, "episode:", episode);

    let allTorrents = [];

    if (episode && episode !== "all") {
      // Format episode number with leading zero for better search results
      const episodeNum = parseInt(episode);
      const episodeFormatted = episodeNum.toString().padStart(2, "0");

      // Clean the title by removing year
      const cleanAnimeTitle = cleanTitle(decodedTitle);

      // Optimized: Encoder-specific patterns first, fewer variations
      const searchVariations = [
        // Encoder-specific patterns (most likely to yield correct result)
        `[ASW] ${cleanAnimeTitle} - ${episodeNum}`,
        `[ASW] ${cleanAnimeTitle} ${episodeNum}`,
        `[EMBER] ${cleanAnimeTitle} S01E${episodeFormatted}`,
        `[EMBER] ${cleanAnimeTitle} ${episodeNum}`,
        `[Anime Time] ${cleanAnimeTitle} S01E${episodeFormatted}`,
        `[Anime Time] ${cleanAnimeTitle} ${episodeNum}`,
        `[Erai-raws] ${cleanAnimeTitle} - ${episodeNum}`,
        `[Erai-raws] ${cleanAnimeTitle} ${episodeNum}`,
        // General patterns
        `${cleanAnimeTitle} - ${episodeNum}`,
        `${cleanAnimeTitle} ${episodeNum}`,
        `${cleanAnimeTitle} EP${episodeFormatted}`,
        `${cleanAnimeTitle} E${episodeFormatted}`,
        `${cleanAnimeTitle} [${episodeFormatted}]`,
        `${cleanAnimeTitle} (${episodeFormatted})`,
      ];

      // Try each search variation with proper delays
      for (const searchQuery of searchVariations) {
        try {
          const encodedTitle = encodeURIComponent(searchQuery);
          const nyaaUrl = `https://nyaa.si/?f=0&c=1_0&q=${encodedTitle}`;

          const response = await axios.get(nyaaUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            timeout: 10000, // 10 second timeout
          });

          const $ = cheerio.load(response.data);

          let foundRelevant = false;
          $("tbody tr").each((index, element) => {
            if (index < 7) {
              // Lowered from 15 to 7
              const $row = $(element);
              const title = $row.find("td:nth-child(2) a").text().trim();
              const size = $row.find("td:nth-child(4)").text().trim();
              const date = $row.find("td:nth-child(6)").text().trim();
              const seeds = $row.find("td:nth-child(7)").text().trim();
              const leeches = $row.find("td:nth-child(8)").text().trim();
              const downloadUrl = $row.find("td:nth-child(3) a").attr("href");
              const magnetUrl = $row
                .find("td:nth-child(3) a:nth-child(2)")
                .attr("href");

              if (title && downloadUrl) {
                const isRelevant = isRelevantTorrent(title, cleanAnimeTitle);

                if (isRelevant) {
                  const isDuplicate = allTorrents.some(
                    (torrent) => torrent.title === title
                  );
                  if (!isDuplicate) {
                    allTorrents.push({
                      title,
                      size,
                      date,
                      seeds: parseInt(seeds) || 0,
                      leeches: parseInt(leeches) || 0,
                      downloadUrl: downloadUrl.startsWith("http")
                        ? downloadUrl
                        : `https://nyaa.si${downloadUrl}`,
                      magnetUrl: magnetUrl
                        ? `https://nyaa.si${magnetUrl}`
                        : null,
                    });
                    foundRelevant = true;
                  }
                }
              }
            }
          });

          // Shorter delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          if (error.response && error.response.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } else {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          console.error("Error fetching from nyaa.si:", error.message);
          continue;
        }
      }
    } else {
      // Search for all episodes - use cleaned title without year
      const cleanAnimeTitle = cleanTitle(decodedTitle);
      const searchVariations = [
        cleanAnimeTitle,
        cleanAnimeTitle.replace(/\s+/g, " ").trim(), // Normalize spaces
      ];

      // Try each search variation
      for (const searchQuery of searchVariations) {
        if (allTorrents.length > 0) break; // Stop if we found results

        const encodedTitle = encodeURIComponent(searchQuery);
        const nyaaUrl = `https://nyaa.si/?f=0&c=1_0&q=${encodedTitle}`;

        try {
          const response = await axios.get(nyaaUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            timeout: 10000, // 10 second timeout
          });

          const $ = cheerio.load(response.data);

          $("tbody tr").each((index, element) => {
            if (index < 30) {
              // Limit to first 30 results for all episodes search
              const $row = $(element);
              const title = $row.find("td:nth-child(2) a").text().trim();
              const size = $row.find("td:nth-child(4)").text().trim();
              const date = $row.find("td:nth-child(6)").text().trim();
              const seeds = $row.find("td:nth-child(7)").text().trim();
              const leeches = $row.find("td:nth-child(8)").text().trim();
              const downloadUrl = $row.find("td:nth-child(3) a").attr("href");
              const magnetUrl = $row
                .find("td:nth-child(3) a:nth-child(2)")
                .attr("href");

              if (
                title &&
                downloadUrl &&
                isRelevantTorrent(title, searchQuery)
              ) {
                // Check if this torrent is already in our list
                const isDuplicate = allTorrents.some(
                  (torrent) => torrent.title === title
                );
                if (!isDuplicate) {
                  allTorrents.push({
                    title,
                    size,
                    date,
                    seeds: parseInt(seeds) || 0,
                    leeches: parseInt(leeches) || 0,
                    downloadUrl: downloadUrl.startsWith("http")
                      ? downloadUrl
                      : `https://nyaa.si${downloadUrl}`,
                    magnetUrl: magnetUrl ? `https://nyaa.si${magnetUrl}` : null,
                  });
                }
              }
            }
          });

          // Add delay between requests to avoid rate limiting
          if (searchVariations.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          if (error.response && error.response.status === 429) {
            break; // Stop trying more variations if rate limited
          }
          console.error("Error fetching from nyaa.si:", error.message);
        }
      }
    }

    // Sort by encoder priority first, then by seeds within each priority group
    allTorrents.sort((a, b) => {
      const priorityA = getEncoderPriority(a.title);
      const priorityB = getEncoderPriority(b.title);

      // First sort by encoder priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Then sort by seeds within the same priority group
      return b.seeds - a.seeds;
    });

    allTorrents = allTorrents.slice(0, 40);

    console.log("Returning", allTorrents.length, "torrents for", decodedTitle);
    res.json(allTorrents);
  } catch (error) {
    console.error("Error fetching torrents:", error);
    res.status(500).json({ error: "Failed to fetch torrent data" });
  }
});

// Get popular anime
app.get("/api/popular", async (req, res) => {
  try {
    // Check cache first
    const cachedData = getCachedData("popular");
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      query {
        Page(page: 1, perPage: 20) {
          media(type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
            }
            averageScore
            episodes
            status
            seasonYear
          }
        }
      }
    `;

    const response = await axios.post(ANILIST_API, { query });
    const data = response.data.data.Page.media;

    // Cache the result
    setCachedData("popular", data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching popular anime:", error);
    res.status(500).json({ error: "Failed to fetch popular anime" });
  }
});

// Get trending anime
app.get("/api/trending", async (req, res) => {
  try {
    // Check cache first
    const cachedData = getCachedData("trending");
    if (cachedData) {
      return res.json(cachedData);
    }

    const query = `
      query {
        Page(page: 1, perPage: 20) {
          media(type: ANIME, sort: TRENDING_DESC) {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              medium
            }
            averageScore
            episodes
            status
            seasonYear
          }
        }
      }
    `;

    const response = await axios.post(ANILIST_API, { query });
    const data = response.data.data.Page.media;

    // Cache the result
    setCachedData("trending", data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching trending anime:", error);
    res.status(500).json({ error: "Failed to fetch trending anime" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
