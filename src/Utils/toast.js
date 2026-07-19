// Aviso breve ("toast"). Só se mostra na app: a web non monta ToastCenter e o evento ignórase.
export const showToast = (message, type = 'success') => {
	if (!message) return;
	window.dispatchEvent(
		new CustomEvent('app:toast', {
			detail: {
				message,
				type,
			},
		})
	);
};
