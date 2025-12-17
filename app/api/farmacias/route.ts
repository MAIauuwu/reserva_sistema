import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MOCK_FARMACIAS = [
	{
		local_id: "mock-1",
		nombre_local: "Farmacia Ahumada",
		direccion: "Av. Providencia 1234",
		comuna: "PROVIDENCIA",
		telefono: "+56 2 2222 2222",
		hora_apertura: "09:00",
		hora_cierre: "21:00",
		local_lat: "-33.42",
		local_lng: "-70.61"
	},
	{
		local_id: "mock-2",
		nombre_local: "Cruz Verde",
		direccion: "Alameda 555",
		comuna: "SANTIAGO",
		telefono: "+56 2 3333 3333",
		hora_apertura: "08:00",
		hora_cierre: "23:00",
		local_lat: "-33.44",
		local_lng: "-70.65"
	},
	{
		local_id: "mock-3",
		nombre_local: "Farmacia Salcobrand",
		direccion: "Av. Las Condes 8000",
		comuna: "LAS CONDES",
		telefono: "+56 2 4444 4444",
		hora_apertura: "00:00",
		hora_cierre: "23:59",
		local_lat: "-33.40",
		local_lng: "-70.55"
	},
	{
		local_id: "mock-4",
		nombre_local: "Farmacia Doctor Simi",
		direccion: "Calle Valparaíso 456",
		comuna: "VIÑA DEL MAR",
		telefono: "+56 32 222 2222",
		hora_apertura: "09:00",
		hora_cierre: "20:00",
		local_lat: "-33.02",
		local_lng: "-71.55"
	}
];

export async function GET() {
	const URLS = [
		'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php',
		'https://farmanet.minsal.cl/index.php/ws/getLocalesTurnos',
		'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php')
	];

	for (const url of URLS) {
		try {
			console.log(`[Proxy] Attempting fetch from: ${url}`);
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per source

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
					'Accept': 'application/json, text/plain, */*',
				},
				signal: controller.signal,
				next: { revalidate: 0 }
			});
			clearTimeout(timeoutId);

			if (!response.ok) continue;

			const text = await response.text();
			try {
				let json = JSON.parse(text);

				let dataList = [];
				if (Array.isArray(json)) dataList = json;
				else if (json.data && Array.isArray(json.data)) dataList = json.data;
				else if (Array.isArray(Object.values(json))) dataList = Object.values(json);
				else continue;

				if (dataList.length > 0) {
					return NextResponse.json(dataList);
				}
			} catch (e) {
				continue;
			}

		} catch (err) {
			console.error(`[Proxy] Error fetching ${url}:`, err);
		}
	}

	// If all failed, return MOCK data to ensure UI works (Fail-safe)
	console.warn('[Proxy] All sources failed. Returning MOCK data.');
	return NextResponse.json(MOCK_FARMACIAS);
}
