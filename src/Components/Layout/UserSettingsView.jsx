import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { actualizarPreferenciasUsuarioActual, seleccionarUsuarioActual } from '@/Features/Users/usuariosSlice';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations, languageNames } from '@/i18n/translations';

export default function UserSettingsView() {
	const dispatch = useDispatch();
	const idioma = useSelector(seleccionarIdioma);
	const usuarioActual = useSelector(seleccionarUsuarioActual);
	const t = translations[idioma] || translations.gl;

	const [form, setForm] = useState({
		imaxePerfil: '',
		idiomaPredeterminado: 'gl',
		temaPredeterminado: 'claro',
		xenero: 'F',
	});

	useEffect(() => {
		if (!usuarioActual) return;
		setForm({
			imaxePerfil: usuarioActual.imaxePerfil || '',
			idiomaPredeterminado: usuarioActual.idiomaPredeterminado || 'gl',
			temaPredeterminado: usuarioActual.temaPredeterminado || 'claro',
			xenero: usuarioActual.xenero || 'F',
		});
	}, [usuarioActual]);

	const onChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = (e) => {
		e.preventDefault();
		dispatch(actualizarPreferenciasUsuarioActual(form));
	};

	return (
		<div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300'>
			<h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-6'>{t.userSettingsTitle}</h2>
			<form onSubmit={onSubmit} className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.profileImage}</label>
					<input
						type='text'
						name='imaxePerfil'
						value={form.imaxePerfil}
						onChange={onChange}
						placeholder='https://...'
						className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'
					/>
				</div>
				<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.defaultLanguage}</label>
						<select
							name='idiomaPredeterminado'
							value={form.idiomaPredeterminado}
							onChange={onChange}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
							<option value='gl'>{languageNames.gl}</option>
							<option value='es'>{languageNames.es}</option>
							<option value='en'>{languageNames.en}</option>
						</select>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.defaultTheme}</label>
						<select
							name='temaPredeterminado'
							value={form.temaPredeterminado}
							onChange={onChange}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
							<option value='claro'>{t.themeLightLabel}</option>
							<option value='oscuro'>{t.themeDarkLabel}</option>
						</select>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t.genderShort}</label>
						<select
							name='xenero'
							value={form.xenero}
							onChange={onChange}
							className='w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white'>
							<option value='M'>{t.genderMasculine}</option>
							<option value='F'>{t.genderFeminine}</option>
						</select>
					</div>
				</div>
				<div className='pt-2'>
					<button
						type='submit'
						className='px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow font-medium text-sm'>
						{t.saveOptions}
					</button>
				</div>
			</form>
		</div>
	);
}
