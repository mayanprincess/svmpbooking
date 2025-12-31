<script lang="ts">
	/**
	 * Image Carousel Component
	 * Compact, swipeable image carousel for room cards
	 */

	interface Props {
		images: Array<{ src: string; alt: string }>;
		autoplay?: boolean;
	}

	let { images, autoplay = false }: Props = $props();

	let currentIndex = $state(0);
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let loadedImages = $state<boolean[]>(images.map(() => false));
	let imageErrors = $state<boolean[]>(images.map(() => false));

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
		loadedImages[index] = true;
	}

	function handleImageError(index: number) {
		imageErrors[index] = true;
		console.warn(`Failed to load image: ${images[index].src}`);
	}

	// Auto-play functionality
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
	<!-- Images -->
	<div class="carousel-images">
		{#each images as image, index}
			{#if !imageErrors[index]}
				<img
					src={image.src}
					alt={image.alt}
					class="carousel-image"
					class:active={index === currentIndex}
					class:loaded={loadedImages[index]}
					loading={index === 0 ? 'eager' : 'lazy'}
					onload={() => handleImageLoad(index)}
					onerror={() => handleImageError(index)}
				/>
			{/if}
		{/each}
	</div>

	<!-- Navigation Arrows -->
	{#if images.length > 1}
		<button
			class="carousel-nav carousel-prev"
			onclick={prevImage}
			aria-label="Previous image"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</button>

		<button
			class="carousel-nav carousel-next"
			onclick={nextImage}
			aria-label="Next image"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 18l6-6-6-6"/>
			</svg>
		</button>

		<!-- Dots Indicator -->
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

	/* Navigation Arrows */
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

	/* Dots Indicator */
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

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.carousel-nav {
			opacity: 0.7;
		}
	}
</style>

