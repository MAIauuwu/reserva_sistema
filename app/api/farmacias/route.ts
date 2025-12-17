import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
	const URLS = [
		'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php',
		'https://farmanet.minsal.cl/index.php/ws/getLocalesTurnos',
		'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php')
	];

	for (const url of URLS) {
		try {
			console.log(`[Proxy] Attempting fetch from: ${url}`);
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': 'application/json, text/plain, */*',
					'Accept-Language': 'es-CL,es;q=0.9',
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache'
				},
				next: { revalidate: 0 }
			});

			if (!response.ok) {
				console.warn(`[Proxy] Failed ${url} with status ${response.status}`);
				continue;
			}

			const text = await response.text();
			// Validate JSON
			try {
				let json = JSON.parse(text);

				// Ensure it's authentic data (array check)
				// Some APIs wrap in { data: ... } or { local_id: ... } directly
				let dataList = [];
				if (Array.isArray(json)) dataList = json;
				else if (json.data && Array.isArray(json.data)) dataList = json.data;
				else if (Array.isArray(Object.values(json))) dataList = Object.values(json); // Sometimes object with index keys
				else {
					// Try removing BOM if present usually handled by JSON.parse
					console.warn(`[Proxy] Unexpected JSON structure from ${url}`);
					continue;
				}

				// Return successful data
				return NextResponse.json(dataList);

			} catch (e) {
				console.warn(`[Proxy] Invalid JSON from ${url}:`, e);
				continue;
			}

		} catch (err) {
			console.error(`[Proxy] Error fetching ${url}:`, err);
		}
	}

	// If we reach here, all attempts failed
	return NextResponse.json(
		{ error: 'Todas las fuentes de datos fallaron. Intente más tarde.' },
		{ status: 502 }
	);
}
