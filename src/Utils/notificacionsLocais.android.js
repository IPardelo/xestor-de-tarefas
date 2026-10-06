export const cargarNotificacionsLocais = async () => {
	const modulo = await import('@capacitor/local-notifications');
	return { plugin: modulo.LocalNotifications };
};
