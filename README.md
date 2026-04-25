# XestorDeTarefas - Xestión de tarefas

XestorDeTarefas é unha aplicación moderna de xestión de tarefas construída con React, Redux, Vite e TailwindCSS. Permite ás persoas usuarias crear, organizar e facer seguimento das súas tarefas dun xeito eficiente cunha interface atractiva e doada de usar.

![XestorDeTarefas Screenshot](public/Images/Interfaz.png)

## 🚀 Características

- ✅ Crear, editar e eliminar tarefas
- 📋 Marcar tarefas como completadas
- 🔍 Filtrar tarefas por estado (todas, activas, completadas)
- 🌓 Modo escuro/claro
- 📱 Deseño responsive para dispositivos móbiles e de escritorio
- 💾 Almacenamento local (`localStorage`) para persistencia de datos
- ✨ Animacións fluidas con Framer Motion
- 🎨 Interface de usuario moderna con TailwindCSS e MUI

## 📋 Requisitos previos

- Node.js (v18.0.0 ou superior)
- npm, yarn ou pnpm

## 🛠️ Instalación

1. Clonar o repositorio:
```bash
git clone https://github.com/IPardelo/xestor-de-tarefas.git
cd XestorDeTarefas
```

2. Instalar dependencias:
```bash
# Con npm
npm install

# Con pnpm
pnpm install
```

3. Iniciar o servidor de desenvolvemento:
```bash
# Con npm
npm run dev

# Con pnpm
pnpm run dev
```

4. Abrir [http://localhost:5173](http://localhost:5173) no navegador.

## 🏗️ Estrutura do proxecto

```
xestordetarefas/
├── public/                 # Arquivos estáticos
├── src/                    # Código fonte
│   ├── App/                # Configuración global da aplicación
│   │   └── store.js        # Configuración da Redux store
│   ├── Assets/             # Recursos (imaxes, iconas, etc.)
│   ├── Components/         # Compoñentes reutilizables
│   │   ├── Layout/         # Compoñentes de estrutura
│   │   └── Tasks/          # Compoñentes específicos de tarefas
│   ├── Features/           # Características cos seus slices de Redux
│   │   ├── Tasks/          # Xestión de tarefas
│   │   └── Theme/          # Xestión do tema
│   ├── Styles/             # Estilos globais
│   ├── App.jsx             # Compoñente principal
│   ├── index.css           # Estilos globais
│   └── main.jsx            # Punto de entrada
├── index.html              # Plantilla HTML
├── vite.config.js          # Configuración de Vite
├── package.json            # Dependencias e scripts
└── README.md               # Documentación
```

## 🧠 Decisións de arquitectura

### Redux Toolkit

Úsase Redux Toolkit para a xestión do estado global da aplicación, seguindo un patrón de arquitectura baseado en características (`feature-based`), o que facilita a organización e o mantemento do código.

### Almacenamento local

As tarefas almacénanse no `localStorage` do navegador, o que permite que os datos persistan entre sesións sen necesidade dunha base de datos ou API externa.

### Modo escuro

A aplicación inclúe un sistema de temas que permite cambiar entre modo claro e escuro, empregando as capacidades de TailwindCSS para clases condicionais.

### Animacións

Úsase Framer Motion para engadir animacións fluidas que melloran a experiencia de usuario ao interactuar cos elementos da interface.

## 🧪 Tecnoloxías empregadas

- [React](https://reactjs.org/) - Biblioteca para construír interfaces de usuario
- [Redux Toolkit](https://redux-toolkit.js.org/) - Ferramentas para simplificar a lóxica de Redux
- [Vite](https://vitejs.dev/) - Contorno de desenvolvemento rápido
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS utilitario
- [MUI (Material-UI)](https://mui.com/) - Compoñentes de React baseados en Material Design
- [Framer Motion](https://www.framer.com/motion/) - Biblioteca de animacións para React

## 🔍 Melloras futuras

- Integración cun backend para sincronización de datos entre dispositivos
- Sistema de autenticación de usuarios
- Categorías e etiquetas para organizar tarefas
- Vista de calendario para programar tarefas
- Notificacións e recordatorios
- Funcionalidade de arrastrar e soltar (`drag and drop`)
- Exportación e importación de datos

## 📄 Licenza

Este proxecto está baixo a licenza MIT. Consulta o arquivo `LICENSE` para máis detalles.

## 👨‍💻 Autor

[Ismael Castiñeira](https://ipardelo.es)
[Web](https://ipardelo.es)

---

Grazas por usar XestorDeTarefas! Agardamos que esta ferramenta che axude a organizar as túas tarefas dun xeito eficiente. Se tes algunha suxestión ou atopas algún problema, non dubides en abrir unha incidencia en GitHub.
