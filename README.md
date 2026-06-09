# XestorDeTarefas

Aplicación de xestión persoal de tarefas e proxectos feita con React + Redux Toolkit + Vite.

## Repositorios

- Web (este repo): [IPardelo/xestor-de-tarefas-web](https://github.com/IPardelo/xestor-de-tarefas-web)
- Android: [IPardelo/xestor-de-tarefas-app](https://github.com/IPardelo/xestor-de-tarefas-app)

Inclúe multiusuario local, proxectos, calendario, internacionalización (`gl`/`es`/`en`), tema claro/escuro e lectura de credenciais KDBX de proxectos.

![XestorDeTarefas Screenshot](public/Images/Interfaz.png)

## Evolución por versión

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

## Características actuais

- Xestión de tarefas: crear, editar, eliminar, completar, buscar, filtrar e ordenar.
- Módulo de notas: notas de texto e notas tipo lista/checklist con cor personalizada.
- Ordenación de notas por fixación e última actualización.
- Xestión de usuarios.
- Xestión de proxectos con datos de cliente.
- Vista de calendario anual/mensual con sincronización con Google Calendar.
- Persistencia e sincronización con Firebase Firestore (estado compartido).

## Requisitos

- Node.js 18+ (recomendado 20+)
- npm
- Windows, Linux ou macOS

## Arranque en desenvolvemento

1) Instalar dependencias:

```bash
npm install
```

2) Iniciar aplicación:

```bash
npm run dev
```

3) Abrir no navegador:

- [http://localhost:5173](http://localhost:5173)

### Arranque rápido en Windows

Tamén podes usar o script `iniciar-app.bat` na raíz do proxecto, que:

- abre o servidor Vite nunha consola nova,
- e abre automaticamente o navegador.

## Scripts dispoñibles

- `npm run dev` - servidor de desenvolvemento.
- `npm run build` - build de produción.
- `npm run preview` - previsualización da build.
- `npm run lint` - lint do código.

## Modo multiusuario real (Firebase)

Para usar a mesma app desde dous ordenadores/móbiles e compartir cambios:

1) Crea un proxecto en Firebase e activa Firestore.
2) Enche cos datos necesarios o arquivo `.env.example` na raíz do proxecto e renomeao a `.env`.
4) Arranca a app (`npm run dev` ou `iniciar-app.bat`) nos dispositivos que queiras.

A app usa Firestore como persistencia principal e sincroniza cambios entre sesións.

## KDBX (KeePass)

- A lectura de KDBX está dispoñible desde Proxectos e restrinxida a usuario admin.
- Requírese ruta e contrasinal válidas.
- A base KDBX con Argon2 está soportada na execución local do proxecto.

## Despregamento

Para funcionalidade completa (incluíndo KDBX), precisa un entorno que execute Node.js.

## Estrutura xeral

```text
src/
  App/                # Store e persistencia
  Components/         # UI por áreas (Tasks, Projects, Layout, Options...)
  Features/           # Slices Redux (Tasks, Users, Projects, Theme, Language)
  i18n/               # Traducións
vite.config.js        # Configuración Vite + endpoint local de KDBX
```

## Tecnoloxías

- React 19
- Redux Toolkit
- Vite 6
- Tailwind CSS 4
- Framer Motion
- MUI
- kdbxweb

## Licenza

MIT. Ver `LICENSE`.

## Autor

[Ismael Castiñeira](https://ipardelo.es)

```bash
VIVA GHALISIA E A COSTA DA MORTE! 💀
```