/**
 * OPERA PMS Configuration (Server-Side Only)
 * Contains sensitive credentials - MUST ONLY be imported in server-side code
 * For client-side code, use opera-config.ts instead
 */

import { env } from '$env/dynamic/private';
import { operaStaticConfig } from './opera-config';

export const operaConfig = {
	// API Configuration (Sensitive - Server-Side Only)
	gatewayUrl: env.OPERA_GATEWAY_URL?.replace(/\/$/, '') || '',
	enterpriseId: env.OPERA_ENTERPRISE_ID || '',
	hotelId: env.OPERA_HOTEL_ID || '',
	clientId: env.OPERA_CLIENT_ID || '',
	clientSecret: env.OPERA_CLIENT_SECRET || '',
	appKey: env.OPERA_APP_KEY || '',
	scope: env.OPERA_SCOPE || '',
	defaultRatePlanCode: env.OPERA_DEFAULT_RATE_PLAN_CODE || 'AIF-2025',
	timeout: parseInt(env.OPERA_TIMEOUT || '15000', 10),
	connectTimeout: parseInt(env.OPERA_CONNECT_TIMEOUT || '5000', 10),

	// Static Configuration (Re-exported from public config)
	roomTypes: operaStaticConfig.roomTypes,
	ratePlans: operaStaticConfig.ratePlans,
	packageTypes: operaStaticConfig.packageTypes,
	amenities: operaStaticConfig.amenities,
	views: operaStaticConfig.views
} as const;

/**
 * Validate that all required OPERA configuration is present
 */
export function validateOperaConfig(): void {
	const required = [
		'gatewayUrl',
		'enterpriseId',
		'hotelId',
		'clientId',
		'clientSecret',
		'appKey',
		'scope'
	] as const;

	const missing = required.filter((key) => !operaConfig[key]);

	if (missing.length > 0) {
		throw new Error(
			`Missing required OPERA configuration: ${missing.join(', ')}. Please check your environment variables.`
		);
	}
}
