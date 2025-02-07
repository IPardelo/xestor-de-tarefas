// Plataforma para a que se compilou a app.
// "android" cando se usa `vite --mode android` (scripts dev:android, build:android e android:*).
export const plataforma = import.meta.env.MODE === 'android' ? 'android' : 'web';

export const esApp = plataforma === 'android';
export const esWeb = !esApp;
