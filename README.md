<div align="center">

<br>

**Aplicación de xestión persoal de tarefas e proxectos**

Planifica o teu día, crea e completa tarefas, agrupa o traballo por proxectos e cliente,
garda notas e listas de comprobación, e revisa todo no calendario.

<br>

[![Licenza](https://img.shields.io/badge/licenza-MIT-22c55e?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-6-007FFF?style=flat-square&logo=mui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055FF?style=flat-square&logo=framer&logoColor=white)
![KeePass](https://img.shields.io/badge/KDBX-kdbxweb-6ABF4B?style=flat-square&logo=keepassxc&logoColor=white)

</div>

## Por que

As aplicacións de tarefas comerciais pídenche unha conta nun servidor alleo, gardan os teus
datos onde non ves, e tarde ou cedo poñen detrás dun pago o que antes era gratis.
XestorDeTarefas nace da idea contraria: **a app é túa e os datos tamén**.

## Configuración

### Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- Windows, Linux ou macOS

### Scripts

Todos os comandos `npm` execútanse dende a carpeta `app/`.

| Script | Que fai |
| --- | --- |
| `npm run dev` | Web en modo desenvolvemento |
| `npm run build` | Compila a web en `dist/` |

## Estrutura xeral

```text
xestor-de-tarefas/
├─ app/                               # Todo o código da app (web, escritorio e Android)
│  ├─ config/
│  │  ├─ apiLocal.js                  # /api/kdbx/read e /api/ical (compartido por Vite e escritorio)
│  │  ├─ vite.config.js               # Vite + React + Tailwind + /api/kdbx/read + /api/ical + modo android
│  ├─ public/
│  │  └─ Images/                      # Logo, banner e capturas do README
│  ├─ src/
│  │  ├─ Features/                    # Slices Redux Toolkit
│  │  │  ├─ Tasks/tareasSlice.js
│  │  │  ├─ Projects/proxectosSlice.js
│  │  │  ├─ Notes/notasSlice.js
│  │  │  ├─ Users/usuariosSlice.js
│  │  │  ├─ Theme/temaSlice.js
│  │  │  └─ Language/idiomaSlice.js
│  │  ├─ i18n/
│  │  │  └─ translations.js           # Traducións gl / es / en
│  │  ├─ Assets/                      # Fontes SF Pro e Font Awesome
│  │  ├─ Styles/DarkMode.css          # Estilos do tema escuro
│  │  ├─ Utils/                       # plataforma.js (esApp), toast.js e ical.js (carga de calendarios)
│  │  └─ index.css                    # Estilos base + Tailwind
│  ├─ index.html                      # HTML raíz de Vite
│  ├─ jsconfig.json                   # Alias @ → /src
│  └─ package.json                    # Scripts npm (execútanse dende app/)
├─ LICENSE
└─ README.md
```


## Autor

[Ismael Castiñeira](https://ipardelo.es)

```bash
VIVA GHALISIA E A COSTA DA MORTE! 💀
```