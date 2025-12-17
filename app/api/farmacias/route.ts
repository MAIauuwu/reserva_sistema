import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const REMOTE_API = 'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';

		const response = await fetch(REMOTE_API, {
			method: 'GET',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				'Accept': 'application/json',
			},
			next: { revalidate: 3600 } // Cache for 1 hour to reduce load/errors
		});

		if (!response.ok) {
			throw new Error(`External API responded with ${response.status}`);
		}

		const text = await response.text();
		// Sometimes the API returns text with BOM or weird encoding, but usually standard JSON string.

		try {
			const json = JSON.parse(text);
			return NextResponse.json(json);
		} catch (parseError) {
			console.error('Error parsing JSON from external API:', parseError);
			console.error('Raw response snippet:', text.slice(0, 200));
			return NextResponse.json({ error: 'Invalid JSON from source', raw: text.slice(0, 500) }, { status: 502 });
		}

	} catch (error) {
		console.error('Error fetching farmacias:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch data' },
			{ status: 500 }
		);
	}
}
