import { useSelector } from 'react-redux';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { seleccionarUsuarioActualAdmin } from '@/Features/Users/usuariosSlice';
import { firebaseConfig, firebaseSyncDoc, hasFirebaseConfig } from '@/App/firebase';
import { translations } from '@/i18n/translations';

export default function OptionsGlobalView() {
	const idioma = useSelector(seleccionarIdioma);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const t = translations[idioma] || translations.gl;

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-6'>{t.optionsGlobalTitle}</h2>

			{!eAdmin && (
				<p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>{t.optionsAdminOnlyHint}</p>
			)}

			{eAdmin && (
				<div>
					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.firebaseConfigTitle}</h3>
					<form className='space-y-3'>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.firebaseStatusLabel}</label>
							<input
								type='text'
								value={hasFirebaseConfig ? t.firebaseStatusConnected : t.firebaseStatusMissing}
								readOnly
								className='w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.firebaseProjectIdLabel}</label>
							<input
								type='text'
								value={firebaseConfig.projectId || '-'}
								readOnly
								className='w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.firebaseAuthDomainLabel}</label>
							<input
								type='text'
								value={firebaseConfig.authDomain || '-'}
								readOnly
								className='w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.firebaseSyncDocLabel}</label>
							<input
								type='text'
								value={firebaseSyncDoc}
								readOnly
								className='w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white'
							/>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
