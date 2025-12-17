# Sistema de Reservas de Tutorías

Este es un sistema de reservas desarrollado con [Next.js](https://nextjs.org) y [Firebase](https://firebase.google.com/), diseñado con una estética moderna en tonos pasteles.

## Características

- 📅 **Calendario de Reservas**: Visualización clara de cupos disponibles.
- 🛒 **Carrito de Compras**: Permite seleccionar múltiples tutorías antes de confirmar.
- 👥 **Roles de Usuario**: Soporte para Profesores y Alumnos.
- 📧 **Notificaciones**: Confirmaciones por correo electrónico (simulado/real según configuración).
- 💅 **UI Moderna**: Diseño responsivo con Tailwind CSS y colores pasteles.

## Configuración Local

1.  Clona el repositorio.
2.  Instala dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env.local` en la raíz con tus credenciales de Firebase:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
    ```
4.  Corre el servidor de desarrollo:
    ```bash
    npm run dev
    ```

## Despliegue en Vercel

La forma más fácil de desplegar es usando la [Plataforma Vercel](https://vercel.com/new).

1.  Sube tu código a GitHub.
2.  En Vercel, importa tu repositorio.
3.  **IMPORTANTE**: En la sección "Environment Variables", agrega las mismas variables que tienes en tu `.env.local`.
4.  Haz clic en **Deploy**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMAIauuw%2Freserva_sistema)
