import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Permite acceso por Cloudflare Tunnel y otros hosts (URL cambia en cada quick tunnel)
		allowedHosts: true
	}
});
