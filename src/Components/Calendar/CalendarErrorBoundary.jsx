import React from 'react';

export default class CalendarErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, errorMessage: '' };
	}

	static getDerivedStateFromError(error) {
		return {
			hasError: true,
			errorMessage: error?.message || 'Erro descoñecido no calendario',
		};
	}

	componentDidCatch(error, info) {
		console.error('Erro en CalendarView:', error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
					<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-2'>
						Erro ao abrir o calendario
					</h2>
					<p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
						Produciuse un erro interno. A aplicación segue funcionando no resto de vistas.
					</p>
					<p className='text-xs font-mono break-words text-red-600 dark:text-red-300'>
						{this.state.errorMessage}
					</p>
				</div>
			);
		}

		return this.props.children;
	}
}
