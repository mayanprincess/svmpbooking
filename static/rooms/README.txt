To add room images:
1. Create folders for each room type (1BBFG, 1BGS, etc.)
2. Add numbered images in each folder. Supported extensions (tried in order): .jpg, .jpeg, .png
   Examples: 1.jpg, 2.png, 3.jpeg — same number, one file per slot
3. By default the carousel requests up to 5 images per room type (see ROOM_IMAGE_COUNTS in src/lib/utils/room-images.ts); raise it if you add more (e.g. 1BPTG uses 10).

Example structure:
static/rooms/1BBFG/1.jpg
static/rooms/1BBFG/2.png
static/rooms/1BGS/1.jpeg
...
