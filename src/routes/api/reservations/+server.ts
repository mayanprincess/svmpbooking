/**
 * Reservations API Endpoint
 * Creates reservations in Opera PMS
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { operaClient } from '$lib/services/opera-client';
import type { ReservationRequest } from '$lib/types/opera';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get complete booking data from frontend
		const bookingData = await request.json();

		console.log('🎫 Creating reservation:', {
			confirmationNumber: bookingData.confirmationNumber,
			checkIn: bookingData.checkIn,
			checkOut: bookingData.checkOut,
			guests: bookingData.totalGuests,
			roomType: bookingData.room?.roomTypeCode,
			rateCode: bookingData.rateCode
		});

		// Validate required fields
		if (!bookingData.checkIn || !bookingData.checkOut) {
			return json({ error: 'Check-in and check-out dates are required' }, { status: 400 });
		}

		if (!bookingData.mainContact?.email) {
			return json({ error: 'Main contact email is required' }, { status: 400 });
		}

		if (!bookingData.room?.roomTypeCode) {
			return json({ error: 'Room type is required' }, { status: 400 });
		}

		if (!bookingData.rateCode) {
			return json({ error: 'Rate plan is required' }, { status: 400 });
		}

	// WARNING: Verify these values came from Opera availability search
	console.warn('⚠️  IMPORTANT: Ensure these values came from Opera availability search:');
	console.warn('   - roomTypeCode:', bookingData.room.roomTypeCode);
	console.warn('   - ratePlanCode:', bookingData.rateCode);
	console.warn('   - If these are hardcoded or not from Opera, the reservation will FAIL');

	// Map to Opera PMS format
	const reservationRequest: ReservationRequest = {
		checkIn: bookingData.checkIn,
		checkOut: bookingData.checkOut,
		roomTypeCode: bookingData.room.roomTypeCode,
		ratePlanCode: bookingData.rateCode,
		adults: bookingData.adults,
		children: bookingData.children,
		guest: {
			firstName: bookingData.mainContact.firstName,
			lastName: bookingData.mainContact.lastName,
			email: bookingData.mainContact.email,
			phone: bookingData.mainContact.phone || ''
		},
		amountBeforeTax: bookingData.selectedRate?.amountBeforeTax || 0,
		promoCode: bookingData.promoCode || undefined,
		specialRequests: undefined // You can add this to your booking flow
	};

	// Create reservation in Opera PMS
	console.log('📤 Sending to Opera PMS with complete data:', JSON.stringify(reservationRequest, null, 2));
	const operaResponse = await operaClient.createReservation(reservationRequest);

		console.log('✅ Opera reservation created:', {
			confirmationNumber: operaResponse.confirmationNumber,
			reservationId: operaResponse.reservationId
		});

		// TODO: In production, you would also:
		// 1. Process payment via payment gateway
		// 2. Save reservation to your database
		// 3. Send confirmation email
		// 4. Create calendar events
		// 5. Notify hotel staff

		// Process payment (mock for now)
		const paymentResult = await processPayment(bookingData);

		if (!paymentResult.success) {
			// If payment fails, you might want to cancel the Opera reservation
			console.error('Payment failed:', paymentResult.error);
			return json(
				{
					error: 'Payment processing failed',
					details: paymentResult.error
				},
				{ status: 402 }
			);
		}

		// Send confirmation email (mock for now)
		await sendConfirmationEmail(bookingData, operaResponse);

		// Return success response
		return json({
			success: true,
			confirmationNumber: operaResponse.confirmationNumber || bookingData.confirmationNumber,
			reservationId: operaResponse.reservationId,
			operaConfirmation: operaResponse.confirmationNumber,
			message: 'Reservation created successfully'
		});
	} catch (error) {
		console.error('❌ Reservation creation error:', error);

		// Return detailed error
		return json(
			{
				error: 'Failed to create reservation',
				details: error instanceof Error ? error.message : 'Unknown error',
				stack: import.meta.env.DEV && error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};

/**
 * Process payment (mock implementation)
 * TODO: Integrate with your payment gateway (Stripe, PayPal, etc.)
 */
async function processPayment(bookingData: any): Promise<{ success: boolean; error?: string }> {
	try {
		console.log('💳 Processing payment...', {
			amount: bookingData.selectedRate?.amountAfterTax,
			currency: 'USD',
			cardLast4: bookingData.payment?.cardNumber?.slice(-4)
		});

		// TODO: Integrate with actual payment gateway
		// Example with Stripe:
		// const paymentIntent = await stripe.paymentIntents.create({
		//   amount: Math.round(bookingData.selectedRate.amountAfterTax * 100),
		//   currency: 'usd',
		//   payment_method: paymentMethodId,
		//   confirm: true
		// });

		// Mock success for now
		await new Promise((resolve) => setTimeout(resolve, 1000));

		console.log('✅ Payment processed successfully');

		return { success: true };
	} catch (error) {
		console.error('Payment processing error:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Payment failed'
		};
	}
}

/**
 * Send confirmation email
 * TODO: Integrate with email service (SendGrid, Resend, etc.)
 */
async function sendConfirmationEmail(bookingData: any, operaResponse: any): Promise<void> {
	try {
		console.log('📧 Sending confirmation email...', {
			to: bookingData.mainContact?.email,
			confirmationNumber: operaResponse.confirmationNumber
		});

		// TODO: Send actual email
		// Example with Resend:
		// await resend.emails.send({
		//   from: 'reservations@mayanprincess.com',
		//   to: bookingData.mainContact.email,
		//   subject: `Booking Confirmation - ${operaResponse.confirmationNumber}`,
		//   html: generateEmailHTML(bookingData, operaResponse)
		// });

		// Mock success for now
		await new Promise((resolve) => setTimeout(resolve, 500));

		console.log('✅ Confirmation email sent');
	} catch (error) {
		console.error('Email sending error:', error);
		// Don't fail the whole reservation if email fails
	}
}
