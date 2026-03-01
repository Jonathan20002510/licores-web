# Licores Web (Vue 3 + API Laravel)

App web que consume la misma API Laravel que la app Flutter, para que usuarios (incluidos iPhone) puedan usar el servicio sin instalar la app.

## Desarrollo local

```bash
cp .env.example .env
# Edita .env y deja VITE_API_BASE_URL apuntando a tu API (ej. https://api.hexasoft-ec.com/api)
npm install
npm run dev
```

Abre http://localhost:5173

## Build

```bash
npm run build
```

Genera la carpeta `dist/` con los archivos estáticos.

## Despliegue en Hostinger (App web Node.js)

1. **CORS en Laravel:** En el servidor donde está tu API (`api.hexasoft-ec.com`), configura CORS para permitir el dominio de Hostinger. En el proyecto Laravel (`api_licores`):
   - Archivo `config/cors.php` ya usa la variable de entorno `CORS_ALLOWED_ORIGINS`.
   - En el `.env` del servidor Laravel, añade el dominio de tu app en Hostinger, por ejemplo:
     ```env
     CORS_ALLOWED_ORIGINS=https://hexasoft-ec.com,https://tu-app.hostinger.com
     ```
   - Si no usas env, edita `config/cors.php` y en `allowed_origins` añade la URL de tu app web (ej. `https://licores-web.tu-dominio.com`).

2. **Subir el proyecto a Hostinger:**
   - Opción A: Conectar repositorio GitHub y desplegar desde ahí.
   - Opción B: Subir por FTP/archivos la carpeta del proyecto (incluyendo `dist/` ya generado y `server.js`).

3. **Servir con Node en Hostinger:**
   - Instala dependencia para producción: `npm install express` (o en Hostinger suele ejecutarse `npm install`).
   - Comando de inicio: `node server.cjs`. El `server.cjs` sirve la carpeta `dist` generada con `npm run build`.
   - En el panel de Hostinger (App web Node.js) configura:
     - Start command: `node server.cjs`
     - Si pide directorio raíz, deja el que contiene `server.cjs` y `dist/`.

4. **Variable de entorno en Hostinger (opcional):** Si quieres cambiar la API en producción, define `VITE_API_BASE_URL` antes del build. En Hostinger a veces se configuran env en el panel; si no, el build usa el valor por defecto de `.env` o `https://api.hexasoft-ec.com/api`.

## Estructura

- `src/config/api.ts` – URL base y endpoints (equivalente a `api_config.dart` en Flutter).
- `src/services/http.ts` – Cliente Axios con Bearer token y manejo de 401.
- `src/stores/auth.ts` – Estado de autenticación (Pinia).
- `src/stores/cart.ts` – Carrito (Pinia).
- `src/views/` – Pantallas: Login, Registro, Home, Producto, Carrito, Pedidos, Perfil, Términos, Privacidad, etc.

La API consumida es la misma que la app Flutter: `https://api.hexasoft-ec.com/api`.
