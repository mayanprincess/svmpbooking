import { env } from '$env/dynamic/private';

export const config = {
	backendUrl: env.BACKEND_URL || '',
};