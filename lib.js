import { youtube } from 'scrape-youtube';

/**
 * Get videos from YouTube
 * @param {string} query video query
 * @param {number} limits video limits
 * @param {string} type video type
 * @return {Array}
 */
export async function getVideos(query, limits = 10, type) {
	const data = await youtube.search(query);

	switch(type.toLowerCase()) {
		case 'video':
			return data.videos.slice(0, limits);
		case 'live-stream':
			return data.streams.slice(0, limits);
		default:
			return [];
	}
}