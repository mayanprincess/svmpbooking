/**
 * Room Images Utility
 * Manages room image paths and provides helper functions
 */

export interface RoomImage {
	src: string;
	alt: string;
}

/**
 * Configuration for number of images per room type
 * Update these values when you add more images to each folder
 */
const ROOM_IMAGE_COUNTS: Record<string, number> = {
	'1BBFG': 3,
	'1BBFS': 3,
	'1BGS': 3,
	'1BPTG': 3,
	'1BPG': 3,
	'2BMS': 3,
	'2BMSS': 3,
	'1BT': 3,
	'2BT': 3,
	'2BJS': 3
};

/**
 * Get all images for a specific room type
 * Images should be stored in /static/rooms/{roomCode}/
 */
export function getRoomImages(roomCode: string): RoomImage[] {
	const imageCount = ROOM_IMAGE_COUNTS[roomCode] || 3;
	const images: RoomImage[] = [];

	for (let i = 1; i <= imageCount; i++) {
		images.push({
			src: `/rooms/${roomCode}/${i}.jpg`,
			alt: `${roomCode} - Image ${i}`
		});
	}

	return images;
}

/**
 * Get the primary image for a room (used for thumbnails)
 */
export function getRoomThumbnail(roomCode: string): string {
	return `/rooms/${roomCode}/1.jpg`;
}

/**
 * Update the image count for a specific room type
 * Call this when you add or remove images
 */
export function updateRoomImageCount(roomCode: string, count: number): void {
	ROOM_IMAGE_COUNTS[roomCode] = count;
}

/**
 * Get the current image count for a room type
 */
export function getRoomImageCount(roomCode: string): number {
	return ROOM_IMAGE_COUNTS[roomCode] || 3;
}

