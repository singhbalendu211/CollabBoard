import { useState, useEffect, useCallback } from 'react';

const IMAGE_CACHE_KEY = 'room_image_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop';

/**
 * Extract meaningful keywords from a room title
 * Removes common words and returns the most relevant search terms
 */
const extractKeywords = (title) => {
  if (!title || typeof title !== 'string') return 'collaboration';

  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'be', 'room', 'space',
    'meeting', 'session', 'team', 'group', 'project'
  ]);

  const words = title
    .toLowerCase()
    .split(/[\s\-_]+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 3); // Take top 3 keywords

  if (words.length === 0) return 'collaboration';
  return words.join(' ');
};

/**
 * Fetch image from backend API
 */
const fetchRoomImageFromAPI = async (roomId, keywords) => {
  try {
    console.log(`Fetching image for room ${roomId} with keywords: "${keywords}"`);
    
    const response = await fetch(
      `/api/rooms/${roomId}/image?keywords=${encodeURIComponent(keywords)}`,
      { method: 'GET' }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`Got image URL for ${roomId}: ${data.imageUrl}`);
      return data.imageUrl;
    } else {
      console.error(`Failed to fetch image: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching room image from API:', error);
  }

  return null;
};

/**
 * Get cached image or fetch a new one
 */
const getCachedOrFetchImage = (roomId, keywords) => {
  const cache = JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}');
  
  // Create a unique cache key combining roomId and keywords
  const cacheKey = `${roomId}_${keywords}`;
  const cached = cache[cacheKey];

  console.log(`Cache lookup for key: ${cacheKey}`, cached ? 'FOUND' : 'NOT FOUND');

  // Return cached image if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached image for ${cacheKey}`);
    return Promise.resolve(cached.url);
  }

  console.log(`Fetching fresh image for ${cacheKey}`);

  // Fetch new image
  return fetchRoomImageFromAPI(roomId, keywords).then(url => {
    if (url) {
      // Update cache with combined key
      cache[cacheKey] = { url, timestamp: Date.now() };
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
      console.log(`Cached new image for ${cacheKey}`);
      return url;
    }
    return DEFAULT_IMAGE;
  }).catch(() => DEFAULT_IMAGE);
};

/**
 * Hook to get room image based on room title
 * Returns image URL, loading state, and error state
 */
export const useRoomImage = (roomId, roomTitle) => {
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchImage = useCallback(async () => {
    if (!roomId) {
      setImageUrl(DEFAULT_IMAGE);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keywords = extractKeywords(roomTitle);
      const url = await getCachedOrFetchImage(roomId, keywords);
      setImageUrl(url || DEFAULT_IMAGE);
    } catch (err) {
      console.error('Error in useRoomImage:', err);
      setError(err.message);
      setImageUrl(DEFAULT_IMAGE);
    } finally {
      setIsLoading(false);
    }
  }, [roomId, roomTitle]);

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  return { imageUrl, isLoading, error };
};

export default useRoomImage;
