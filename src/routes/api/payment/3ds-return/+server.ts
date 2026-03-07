/**
 * 3DS Step-Up Return URL
 * POST /api/payment/3ds-return
 *
 * CyberSource redirects here (inside the step-up iframe) after the
 * customer completes the 3DS challenge. This endpoint returns an HTML
 * page that sends a postMessage to the parent window so the frontend
 * knows the challenge is done.
 */

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const transactionId = formData.get('TransactionId') || '';

	const html = `
<!DOCTYPE html>
<html>
<body>
<script>
	window.parent.postMessage(
		JSON.stringify({
			MessageType: "stepUp.completed",
			TransactionId: "${transactionId}"
		}),
		"*"
	);
</script>
</body>
</html>`;

	return new Response(html, {
		headers: { 'Content-Type': 'text/html' }
	});
};
