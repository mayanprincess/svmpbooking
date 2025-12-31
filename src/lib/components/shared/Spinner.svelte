<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		color?: 'white' | 'primary' | 'secondary';
	}

	let { size = 'md', color = 'white' }: Props = $props();

	const sizeMap = {
		sm: '16px',
		md: '24px',
		lg: '32px'
	};

	const colorMap = {
		white: 'rgba(255, 255, 255, 0.3)',
		primary: 'rgba(24, 52, 83, 0.3)',
		secondary: 'rgba(197, 165, 111, 0.3)'
	};

	const topColorMap = {
		white: 'white',
		primary: 'var(--color-primary)',
		secondary: 'var(--color-secondary)'
	};
</script>

<div 
	class="spinner" 
	style="width: {sizeMap[size]}; height: {sizeMap[size]}; border-color: {colorMap[color]}; border-top-color: {topColorMap[color]}"
></div>

<style>
	.spinner {
		border: 2px solid;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>

