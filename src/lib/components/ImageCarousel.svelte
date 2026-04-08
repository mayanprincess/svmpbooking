<script lang="ts">
	/**
	 * Image Carousel Component
	 * Compact, swipeable image carousel for room cards
	 */

	interface Props {
		images: Array<{ alt: string; candidates: string[] }>;
		autoplay?: boolean;
	}

	let { images, autoplay = false }: Props = $props();

	let currentIndex = $state(0);
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let loadedImages = $state<boolean[]>([]);
	let imageErrors = $state<boolean[]>([]);
	/** Per slide: which candidate URL index we're showing */
	let candidateIndex = $state<number[]>([]);

	$effect(() => {
		void images;
		const n = images.length;
		loadedImages = Array.from({ length: n }, () => false);
		imageErrors = Array.from({ length: n }, () => false);
		candidateIndex = Array.from({ length: n }, () => 0);
		currentIndex = 0;
	});

	function sourceFor(index: number): string {
		const slide = images[index];
		const cands = slide?.candidates ?? [];
		const i = candidateIndex[index] ?? 0;
		return cands[i] ?? cands[0] ?? '';
	}

	function nextImage() {
		currentIndex = (currentIndex + 1) % images.length;
	}

	function prevImage() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	}

	function goToImage(index: number) {
		currentIndex = index;
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}

	function handleTouchMove(e: TouchEvent) {
		touchEndX = e.touches[0].clientX;
	}

	function handleTouchEnd() {
		const diff = touchStartX - touchEndX;
		if (Math.abs(diff) > 50) {
			if (diff > 0) {
				nextImage();
			} else {
				prevImage();
			}
		}
	}

	function handleImageLoad(index: number) {
		loadedImages = loadedImages.map((v, i) => (i === index ? true : v));
	}

	function handleImageError(index: number) {
		const slide = images[index];
		const cands = slide?.candidates ?? [];
		const next = (candidateIndex[index] ?? 0) + 1;
		if (next < cands.length) {
			candidateIndex = candidateIndex.map((v, i) => (i === index ? next : v));
			loadedImages = loadedImages.map((v, i) => (i === index ? false : v));
			return;
		}
		imageErrors = imageErrors.map((v, i) => (i === index ? true : v));
		console.warn(`Failed to load image for slide ${index} (tried: ${cands.join(', ')})`);
	}

	$effect(() => {
		if (autoplay && images.length > 1) {
			const interval = setInterval(nextImage, 4000);
			return () => clearInterval(interval);
		}
	});
</script>

<div
	class="carousel"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
>
	<div class="carousel-images">
		{#each images as _, index}
			{#if !imageErrors[index]}
				{#key `${index}-${candidateIndex[index] ?? 0}`}
					<img
						src={sourceFor(index)}
						alt={images[index].alt}
						class="carousel-image"
						class:active={index === currentIndex}
						class:loaded={loadedImages[index]}
						loading={index === 0 ? 'eager' : 'lazy'}
						onload={() => handleImageLoad(index)}
						onerror={() => handleImageError(index)}
					/>
				{/key}
			{/if}
		{/each}
	</div>

	{#if images.length > 1}
		<button
			class="carousel-nav carousel-prev"
			onclick={prevImage}
			aria-label="Previous image"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>

		<button
			class="carousel-nav carousel-next"
			onclick={nextImage}
			aria-label="Next image"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>

		<div class="carousel-dots">
			{#each images as _, index}
				<button
					class="carousel-dot"
					class:active={index === currentIndex}
					onclick={() => goToImage(index)}
					aria-label={`Go to image ${index + 1}`}
				></button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.carousel {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #f3f4f6;
		border-radius: 12px 12px 0 0;
	}

	.carousel-images {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.carousel-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.4s ease;
		pointer-events: none;
		background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	}

	.carousel-image.loaded {
		background: transparent;
	}

	.carousel-image.active {
		opacity: 1;
		pointer-events: auto;
	}

	.carousel-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		opacity: 0;
		z-index: 10;
		color: var(--color-primary);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.carousel:hover .carousel-nav {
		opacity: 1;
	}

	.carousel-nav:hover {
		background: white;
		transform: translateY(-50%) scale(1.1);
	}

	.carousel-prev {
		left: 8px;
	}

	.carousel-next {
		right: 8px;
	}

	.carousel-dots {
		position: absolute;
		bottom: 12px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 6px;
		z-index: 10;
	}

	.carousel-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.6);
		border: none;
		cursor: pointer;
		transition: all 0.3s;
		padding: 0;
	}

	.carousel-dot:hover {
		background: rgba(255, 255, 255, 0.9);
		transform: scale(1.2);
	}

	.carousel-dot.active {
		width: 18px;
		border-radius: 3px;
		background: white;
	}

	@media (max-width: 768px) {
		.carousel-nav {
			opacity: 0.7;
		}
	}
</style>
