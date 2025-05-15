import { useState } from 'react';
import { useSelector } from 'react-redux';
import { cambiarContrasinal, mensaxeErroAuth } from '@/App/autenticacion';
import { seleccionarIdioma } from '@/Features/Language/idiomaSlice';
import { translations } from '@/i18n/translations';
import { showToast } from '@/Utils/toast';
import { esApp } from '@/Utils/plataforma';

const clasesInput =
	'w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white';

/**
 * Cambio de contrasinal da conta de Firebase Auth con sesión iniciada.
 * Non é un <form> porque vai dentro do formulario de axustes.
 */
export default function CambioContrasinal() {
	const idioma = useSelector(seleccionarIdioma);
	const t = translations[idioma] || translations.gl;
	const [campos, setCampos] = useState({ actual: '', nova: '', confirmacion: '' });
	const [erro, setErro] = useState('');
	const [mensaxe, setMensaxe] = useState('');
	const [gardando, setGardando] = useState(false);

	const onChange = (e) => {
		const { name, value } = e.target;
		setCampos((prev) => ({ ...prev, [name]: value }));
	};

	const onCambiar = async () => {
		setErro('');
		setMensaxe('');
		if (!campos.actual || !campos.nova) return setErro(t.passwordNewRequired);
		if (campos.nova !== campos.confirmacion) return setErro(t.passwordMismatch);
		setGardando(true);
		try {
			await cambiarContrasinal(campos.actual, campos.nova);
			setCampos({ actual: '', nova: '', confirmacion: '' });
			if (esApp) showToast(t.passwordUpdated);
			else setMensaxe(t.passwordUpdated);
		} catch (error) {
			const codigo = error?.code;
			setErro(
				codigo === 'auth/invalid-credential' || codigo === 'auth/wrong-password'
					? t.passwordCurrentInvalid
					: mensaxeErroAuth(error, t)
			);
		} finally {
			setGardando(false);
		}
		return undefined;
	};

	return (
		<div>
			<label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>{t.loginChangePassword}</label>
			<div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
				<input
					type='password'
					name='actual'
					value={campos.actual}
					onChange={onChange}
					placeholder={t.passwordCurrent}
					aria-label={t.passwordCurrent}
					autoComplete='current-password'
					className={clasesInput}
				/>
				<input
					type='password'
					name='nova'
					value={campos.nova}
					onChange={onChange}
					placeholder={t.passwordNew}
					aria-label={t.passwordNew}
					autoComplete='new-password'
					className={clasesInput}
				/>
				<input
					type='password'
					name='confirmacion'
					value={campos.confirmacion}
					onChange={onChange}
					placeholder={t.passwordConfirm}
					aria-label={t.passwordConfirm}
					autoComplete='new-password'
					className={clasesInput}
				/>
			</div>
			<div className='flex items-center justify-between gap-3 mt-2'>
				<p className={`text-sm ${erro ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{erro || mensaxe}</p>
				<button
					type='button'
					onClick={onCambiar}
					disabled={gardando}
					className='shrink-0 px-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-60'>
					{t.loginChangePassword}
				</button>
			</div>
		</div>
	);
}
