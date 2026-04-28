<div align="center">

![XestorDeTarefas Screenshot](public/Images/banner.PNG)

<br>

**Aplicación de xestión persoal de tarefas e proxectos**

Planifica o teu día, crea e completa tarefas, agrupa o traballo por proxectos e cliente,
garda notas e listas de comprobación, e revisa todo no calendario — no ordenador ou no
móbil, sincronizado entre dispositivos e detrás do teu propio inicio de sesión. Sen subscrición, sen anuncios, cos teus datos na túa propia Firebase.

<br>

[![Licenza](https://img.shields.io/badge/licenza-MIT-22c55e?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Android](https://img.shields.io/badge/app%20Android-repo-3ddc84?style=flat-square&logo=android&logoColor=white)](https://github.com/IPardelo/xestor-de-tarefas-app)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.6-764ABC?style=flat-square&logo=redux&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-6-007FFF?style=flat-square&logo=mui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055FF?style=flat-square&logo=framer&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![KeePass](https://img.shields.io/badge/KDBX-kdbxweb-6ABF4B?style=flat-square&logo=keepassxc&logoColor=white)

![XestorDeTarefas Screenshot](public/Images/Interfaz.png)

</div>

## Por que

As aplicacións de tarefas comerciais pídenche unha conta nun servidor alleo, gardan os teus
datos onde non ves, e tarde ou cedo poñen detrás dun pago o que antes era gratis.
XestorDeTarefas nace da idea contraria: **a app é túa e os datos tamén**.

- Os datos viven no teu propio proxecto de Firebase, non nun servizo de terceiros.
- Todo nun só sitio: tarefas, proxectos con cliente, notas e calendario, sen saltar entre apps.
- O mesmo estado no ordenador e no móbil, sincronizado ao instante.
- Pensada en galego dende o primeiro día (e tamén en castelán e inglés).
- Sen subscrición, sen anuncios, sen límites artificiais. Código aberto con licenza MIT.

## Funcionalidades

- ✅ Xestión de tarefas: crear, editar, eliminar, completar, buscar, filtrar e ordenar.
- 📝 Módulo de notas: notas de texto e notas tipo lista/checklist con cor personalizada.
- 📌 Ordenación de notas por fixación e última actualización.
- 👥 Xestión de usuarios.
- 📁 Xestión de proxectos con datos de cliente.
- 📅 Vista de calendario anual/mensual con sincronización con Google Calendar.
- 🔥 Persistencia e sincronización con Firebase Firestore (estado compartido).
- 🔑 Lectura de credenciais KDBX (KeePass) dos proxectos, restrinxida a admin.

## Configuración

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- Windows, Linux ou macOS

### 🔥 Firebase

Para usar a mesma app desde dous ordenadores/móbiles e compartir cambios:

1) Crea un proxecto en Firebase e activa Firestore.
2) Enche cos datos necesarios o arquivo `.env.example` na raíz do proxecto e renomeao a `.env`.
4) Arranca a app (`npm run dev` ou `iniciar-app.bat`) nos dispositivos que queiras.

A app usa Firestore como persistencia principal e sincroniza cambios entre sesións.

### 🔒 KDBX (KeePass)

- A lectura de KDBX está dispoñible desde Proxectos e restrinxida a usuario admin.
- Requírese ruta e contrasinal válidas.
- A base KDBX con Argon2 está soportada na execución local do proxecto.

## Estrutura xeral

```text
xestor-de-tarefas/
├─ public/
│  └─ Images/                     # Logo, banner e capturas do README
├─ kdbx/
│  └─ Database.kdbx               # Base KeePass local (credenciais de proxectos)
├─ scripts/                       # Utilidades auxiliares
├─ android/                       # Envoltorio da app Android
├─ src/
│  ├─ App/
│  │  ├─ store.js                 # configureStore + rexistro de slices
│  │  ├─ persistence.js           # Carga/gardado do estado
│  │  └─ firebase.js              # Inicialización de Firebase/Firestore
│  ├─ Components/                 # UI por áreas
│  │  ├─ Auth/                    # LoginView
│  │  ├─ Layout/                  # Header, Sidebar, UserSettingsView
│  │  ├─ Tasks/                   # TasksList, TaskItem, TaskForm, TaskFilter
│  │  ├─ Projects/                # ProjectsView (con lectura KDBX)
│  │  ├─ Notes/                   # NotesView (notas de texto e checklist)
│  │  ├─ Calendar/                # CalendarView (anual/mensual/diaria)
│  │  ├─ Options/                 # OptionsGlobalView, OptionsUsersView
│  │  └─ UI/                      # DarkMode e compoñentes comúns
│  ├─ Features/                   # Slices Redux Toolkit
│  │  ├─ Tasks/tareasSlice.js
│  │  ├─ Projects/proxectosSlice.js
│  │  ├─ Notes/notasSlice.js
│  │  ├─ Users/usuariosSlice.js
│  │  ├─ Theme/temaSlice.js
│  │  └─ Language/idiomaSlice.js
│  ├─ i18n/
│  │  └─ translations.js          # Traducións gl / es / en
│  ├─ Assets/                     # Fontes SF Pro e Font Awesome
│  ├─ Styles/DarkMode.css         # Estilos do tema escuro
│  ├─ App.jsx                     # Compoñente raíz e enrutado de vistas
│  ├─ main.jsx                    # Punto de entrada (Provider + render)
│  └─ index.css                   # Estilos base + Tailwind
├─ index.html                     # HTML raíz de Vite
├─ vite.config.js                 # Vite + React + Tailwind + endpoint /api/kdbx/read
├─ eslint.config.js               # Regras ESLint 9
├─ jsconfig.json                  # Alias @ → /src
├─ iniciar-app.bat                # Arranque rápido en Windows
├─ .env / .env.example            # Credenciais de Firebase
└─ package.json
```

## Evolución por versión

### v2.1.0

- Visualización por días no calendario
- Melloras visuais en todos os módulos

### v2.0.0

- Novo módulo de **Notas**.
- Accións en notas: crear, editar, eliminar, fixar e marcar ítems.

### v1.1.0

- Melloras de UI e organización da app para uso diario.
- Compoñenente de login.
- Integración co calendario de Google.

### v1.0.0

- Base da aplicación de xestión de tarefas.
- Crear, editar, eliminar e completar tarefas.
- Filtros, busca e ordenación de tarefas.
- Persistencia local no dispositivo.
- Soporte de tema claro/escuro e internacionalización inicial (`gl`/`es`/`en`).
- Ampliación funcional con módulo de proxectos.
- Xestión de usuarios en local con rol administrador.
- Vista de calendario anual/mensual.

## Autor

[Ismael Castiñeira](https://ipardelo.es)

```bash
VIVA GHALISIA E A COSTA DA MORTE! 💀
```