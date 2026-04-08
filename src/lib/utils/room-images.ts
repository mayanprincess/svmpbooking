/**
 * Room Images Utility
 * Manages room image paths and provides helper functions
 */

/** Tried in this order per slide until one file exists (static hosting has no directory listing). */
export const ROOM_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const;

export interface RoomImage {
	alt: string;
	/** Absolute paths under /static — carousel tries each until one loads */
	candidates: string[];
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
 * Use the same base name with extension .jpg, .jpeg, or .png (e.g. 1.jpg or 1.png)
 */
export function getRoomImages(roomCode: string): RoomImage[] {
	const imageCount = ROOM_IMAGE_COUNTS[roomCode] || 3;
	const images: RoomImage[] = [];

	for (let i = 1; i <= imageCount; i++) {
		images.push({
			alt: `${roomCode} - Image ${i}`,
			candidates: ROOM_IMAGE_EXTENSIONS.map((ext) => `/rooms/${roomCode}/${i}${ext}`)
		});
	}

	return images;
}

/**
 * Get the primary image URL for a room (first format tried: .jpg)
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
