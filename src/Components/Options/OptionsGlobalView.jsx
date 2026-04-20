import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { seleccionarUsuarioActualAdmin } from '@/Features/Users/usuariosSlice';
import { actualizarConfiguracionKdbx, seleccionarConfiguracionKdbx } from '@/Features/Projects/proxectosSlice';
import { translations } from '@/i18n/translations';

export default function OptionsGlobalView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const kdbxConfig = useSelector(seleccionarConfiguracionKdbx);
	const t = translations[idioma] || translations.gl;

	const [kdbxForm, setKdbxForm] = useState({
		filePath: 'kdbx\\Database.kdbx',
		password: '1234567890',
	});
	const [appDataPathForm, setAppDataPathForm] = useState('');
	const [appDataPathMsg, setAppDataPathMsg] = useState('');
	const [appDataPathError, setAppDataPathError] = useState('');

	useEffect(() => {
		setKdbxForm({
			filePath: kdbxConfig?.filePath || 'kdbx\\Database.kdbx',
			password: kdbxConfig?.password || '1234567890',
		});
	}, [kdbxConfig]);

	const onKdbxChange = (e) => {
		const { name, value } = e.target;
		setKdbxForm((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmitKdbxConfig = (e) => {
		e.preventDefault();
		dispatch(actualizarConfiguracionKdbx(kdbxForm));
	};

	useEffect(() => {
		if (!eAdmin) return;
		const cargarRutaDatos = async () => {
			try {
				const resp = await fetch('/api/app-data-config');
				const data = await resp.json();
				if (!resp.ok) throw new Error(data?.error || t.appDataPathReadError);
				setAppDataPathForm(data?.appDataPath || '');
			} catch (error) {
				setAppDataPathError(error?.message || t.appDataPathReadError);
			}
		};
		cargarRutaDatos();
	}, [eAdmin, t.appDataPathReadError]);

	const onSubmitAppDataPath = async (e) => {
		e.preventDefault();
		setAppDataPathMsg('');
		setAppDataPathError('');
		try {
			const resp = await fetch('/api/app-data-config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ appDataPath: appDataPathForm }),
			});
			const data = await resp.json();
			if (!resp.ok) throw new Error(data?.error || t.appDataPathSaveError);
			setAppDataPathForm(data?.appDataPath || appDataPathForm);
			setAppDataPathMsg(t.appDataPathSavedOk);
		} catch (error) {
			setAppDataPathError(error?.message || t.appDataPathSaveError);
		}
	};

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-6'>{t.optionsGlobalTitle}</h2>

			{!eAdmin && (
				<p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>{t.optionsAdminOnlyHint}</p>
			)}

			{eAdmin && (
				<div>
					<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.kdbxConfigTitle}</h3>
					<form onSubmit={onSubmitKdbxConfig} className='space-y-3'>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								{t.kdbxPath}
							</label>
							<input
								type='text'
								name='filePath'
								value={kdbxForm.filePath}
								onChange={onKdbxChange}
								placeholder={t.kdbxPath}
								required
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
							/>
						</div>
						<div>
							<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
								{t.kdbxPassword}
							</label>
							<input
								type='password'
								name='password'
								value={kdbxForm.password}
								onChange={onKdbxChange}
								placeholder={t.kdbxPassword}
								required
								className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
							/>
						</div>
						<div className='flex justify-end pt-1'>
							<button
								type='submit'
								className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
								{t.saveKdbxConfig}
							</button>
						</div>
					</form>

					<div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
						<h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>{t.appDataPathTitle}</h3>
						<form onSubmit={onSubmitAppDataPath} className='space-y-3'>
							<div>
								<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
									{t.appDataPathLabel}
								</label>
								<input
									type='text'
									name='appDataPath'
									value={appDataPathForm}
									onChange={(e) => setAppDataPathForm(e.target.value)}
									placeholder={t.appDataPathLabel}
									required
									className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
								/>
							</div>
							{appDataPathMsg && <p className='text-sm text-green-600 dark:text-green-400'>{appDataPathMsg}</p>}
							{appDataPathError && <p className='text-sm text-red-500'>{appDataPathError}</p>}
							<div className='flex justify-end pt-1'>
								<button
									type='submit'
									className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
									{t.saveAppDataPath}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
