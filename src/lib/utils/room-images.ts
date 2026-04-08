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
/** Minimum slides to request per room (carousel tries 1..N until files missing). */
const DEFAULT_ROOM_IMAGE_COUNT = 5;

const ROOM_IMAGE_COUNTS: Record<string, number> = {
	'1BBFG': 5,
	'1BBFS': 5,
	'1BGS': 5,
	'1BPTG': 10,
	'1BPG': 5,
	'2BMS': 5,
	'2BMSS': 5,
	'1BT': 5,
	'2BT': 5,
	'2BJS': 5
};

/**
 * Get all images for a specific room type
 * Images should be stored in /static/rooms/{roomCode}/
 * Use the same base name with extension .jpg, .jpeg, or .png (e.g. 1.jpg or 1.png)
 */
export function getRoomImages(roomCode: string): RoomImage[] {
	const imageCount = ROOM_IMAGE_COUNTS[roomCode] ?? DEFAULT_ROOM_IMAGE_COUNT;
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
	return ROOM_IMAGE_COUNTS[roomCode] ?? DEFAULT_ROOM_IMAGE_COUNT;
}
