import { useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { seleccionarUsuarioActualAdmin } from '@/Features/Users/usuariosSlice';
import { actualizarConfiguracionKdbx, seleccionarConfiguracionKdbx } from '@/Features/Projects/proxectosSlice';
import { firebaseConfig, firebaseSyncDoc, hasFirebaseConfig } from '@/App/firebase';
import { gardarDatosApp, isCloudSyncEnabled } from '@/App/persistence';
import { translations } from '@/i18n/translations';

export default function OptionsGlobalView() {
	const dispatch = useDispatch();
	const store = useStore();
	const idioma = useSelector(seleccionarIdioma);
	const eAdmin = useSelector(seleccionarUsuarioActualAdmin);
	const kdbxConfig = useSelector(seleccionarConfiguracionKdbx);
	const t = translations[idioma] || translations.gl;
	const [gardandoKdbx, setGardandoKdbx] = useState(false);
	const [mensaxeKdbx, setMensaxeKdbx] = useState('');

	const [kdbxForm, setKdbxForm] = useState({
		filePath: 'kdbx\\Database.kdbx',
		password: '1234567890',
	});

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

	const onSubmitKdbxConfig = async (e) => {
		e.preventDefault();
		dispatch(actualizarConfiguracionKdbx(kdbxForm));
		setMensaxeKdbx('');

		if (!isCloudSyncEnabled()) return;

		setGardandoKdbx(true);
		try {
			const state = store.getState();
			await gardarDatosApp({
				usuarios: state.usuarios,
				idioma: state.idioma,
				tema: state.tema,
				tareas: state.tareas,
				proxectos: {
					...state.proxectos,
					kdbxConfig: {
						filePath: (kdbxForm.filePath || '').trim() || 'kdbx\\Database.kdbx',
						password: kdbxForm.password || '1234567890',
					},
				},
			});
			setMensaxeKdbx('Configuración KDBX gardada en Firebase.');
		} catch {
			setMensaxeKdbx('Erro ao gardar a configuración KDBX en Firebase.');
		} finally {
			setGardandoKdbx(false);
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
								disabled={gardandoKdbx}
								className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 font-medium text-sm'>
								{gardandoKdbx ? 'Gardando...' : t.saveKdbxConfig}
							</button>
						</div>
						{mensaxeKdbx && (
							<p className='text-sm text-gray-600 dark:text-gray-300'>{mensaxeKdbx}</p>
						)}
					</form>

					<div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
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
				</div>
			)}
		</div>
	);
}
