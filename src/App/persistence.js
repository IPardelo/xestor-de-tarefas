const API_PATH = '/api/app-data';

export async function cargarDatosApp() {
	const resp = await fetch(API_PATH);
	if (!resp.ok) {
		throw new Error(`Erro ao cargar datos: ${resp.status}`);
	}
	return resp.json();
}

export async function gardarDatosApp(data) {
	await fetch(API_PATH, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
}
