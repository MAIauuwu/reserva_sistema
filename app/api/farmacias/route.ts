import { NextResponse } from 'next/server';

const REMOTE_URL = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';

async function proxyFetch() {
	// Try GET first, fallback to POST if needed
	const defaultHeaders = {
		Accept: 'application/json, text/plain, */*',
		'User-Agent': 'Next.js Server Proxy',
	} as Record<string, string>;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	let res = await fetch(REMOTE_URL, {
		method: 'GET',
		headers: defaultHeaders,
		cache: 'no-store',
		signal: controller.signal
	}).finally(() => clearTimeout(timeoutId));

	if (!res.ok) {
		// Try POST as fallback
		try {
			const controllerPost = new AbortController();
			const timeoutIdPost = setTimeout(() => controllerPost.abort(), 10000);

			res = await fetch(REMOTE_URL, {
				method: 'POST',
				headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
				cache: 'no-store',
				signal: controllerPost.signal
			}).finally(() => clearTimeout(timeoutIdPost));
		} catch (e) {
			// swallow and continue to error handling below
		}
	}

	if (!res.ok) {
		const text = await res.text().catch(() => '');
		return { ok: false, status: res.status, body: text };
	}

	// Attempt to parse JSON, fallback to text
	try {
		const data = await res.json();
		return { ok: true, data };
	} catch (e) {
		const text = await res.text().catch(() => '');
		// Try parse JSON from text
		try {
			const parsed = JSON.parse(text || 'null');
			return { ok: true, data: parsed };
		} catch (e2) {
			console.error('[Proxy] Could not parse JSON from:', text.slice(0, 200));
			return { ok: false, status: 502, body: text };
		}
	}
}

export async function GET() {
	try {
		const result = await proxyFetch();
		if (!result.ok) {
			return NextResponse.json({
				success: false,
				error: result.body || 'Remote API error',
				status: result.status ?? 502,
				rawBody: result.body
			}, { status: 502 });
		}

		// Return both structured and raw formats
		const responseData = Array.isArray(result.data) ? result.data : result.data?.data || [];
		return NextResponse.json(responseData, { status: 200 });
	} catch (err) {
		console.error('[Proxy] Error:', err);
		return NextResponse.json({
			success: false,
			error: 'Internal server error',
			details: err instanceof Error ? err.message : String(err)
		}, { status: 500 });
	}
}

export async function POST() {
	// Mirror GET behavior for POST requests from client
	return GET();
}
