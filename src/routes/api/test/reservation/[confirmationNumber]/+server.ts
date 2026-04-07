import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOperaClient } from '$lib/services/opera-client';

/**
 * Test endpoint to verify reservation in Opera PMS
 * Access: /api/test/reservation/{confirmationNumber}
 */
export const GET: RequestHandler = async ({ params, url }) => {
	const { confirmationNumber } = params;
	const searchById = url.searchParams.get('byId') === 'true';

	try {
		console.log('🔍 Testing reservation lookup for:', confirmationNumber, { searchById });

		let data;
		
		if (searchById) {
			// Search by Reservation ID (more reliable)
			console.log('📌 Searching by Reservation ID (direct method)');
			data = await getOperaClient().getReservationById(confirmationNumber);
		} else {
			// Search by Confirmation Number
			console.log('📌 Searching by Confirmation Number (search method)');
			data = await getOperaClient().getReservationByConfirmationNumber(confirmationNumber);
		}

		return json({
			success: true,
			searchType: searchById ? 'reservationId' : 'confirmationNumber',
			searchValue: confirmationNumber,
			data,
			message: 'Reservation retrieved successfully from Opera PMS'
		});

	} catch (error) {
		console.error('❌ Error looking up reservation:', error);
		
		return json({
			success: false,
			error: 'Failed to lookup reservation',
			details: error instanceof Error ? error.message : 'Unknown error',
			searchValue: confirmationNumber
		}, { status: 500 });
	}
};
