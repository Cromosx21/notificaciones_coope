# Guía de Despliegue en Vercel (Backend + Frontend)

Este proyecto está configurado para desplegarse fácilmente en Vercel. Sigue estos pasos para poner tu generador de PDF en producción.

## Requisitos Previos

*   Tener una cuenta en [Vercel](https://vercel.com/).
*   Tener el CLI de Vercel instalado (`npm i -g vercel`) o hacerlo desde la web conectando tu repositorio de GitHub.

## 1. Solución de Conflictos de Dependencias (ACTUALIZADO)

Para evitar errores de despliegue, hemos limpiado la configuración:
1.  Se eliminó `frontend/vercel.json` para usar la configuración automática de Vercel (Zero Config).
2.  Se alinearon las versiones de `vite`, `@vitejs/plugin-react` y `@tailwindcss/vite` para ser compatibles.

**Si aún tienes problemas:**
1.  Ve a tu proyecto en Vercel -> **Settings** -> **Git**.
2.  Asegúrate de que no haya configuraciones antiguas de "Ignored Build Step".
3.  Si es necesario, fuerza una reinstalación limpia activando "Redeploy" sin caché.

## 2. Configuración del Proyecto

El proyecto ya cuenta con las configuraciones necesarias:
*   `backend/vercel.json`: Configura la función serverless y aumenta la memoria para Puppeteer.
*   `backend/server.js`: Adaptado para detectar si corre en Vercel y usar `puppeteer-core` con `@sparticuz/chromium` (necesario por el límite de tamaño en serverless).

## 3. Despliegue del Backend

1.  Navega a la carpeta del backend:
    ```bash
    cd backend
    ```
2.  Ejecuta el comando de despliegue:
    ```bash
    vercel
    ```
3.  Sigue las instrucciones en pantalla (acepta los valores por defecto).
4.  **IMPORTANTE:** Al finalizar, Vercel te dará una URL de producción (ej. `https://tu-proyecto-backend.vercel.app`). **Copia esta URL.**

## 4. Configuración del Frontend

1.  Abre el archivo `frontend/src/components/GeneratorForm.jsx`.
2.  Busca la línea donde se hace la petición `axios.post`.
3.  Reemplaza `http://localhost:5000` por la URL de tu backend desplegado.
    ```javascript
    // Ejemplo:
    const response = await axios.post('https://tu-proyecto-backend.vercel.app/generate-pdf', formData, ...
    ```

## 5. Despliegue del Frontend

1.  Navega a la carpeta del frontend:
    ```bash
    cd ../frontend
    ```
2.  Ejecuta el comando de despliegue:
    ```bash
    vercel
    ```
3.  Vercel detectará automáticamente que es un proyecto Vite/React.
4.  Acepta la configuración por defecto.

## Notas Importantes sobre Puppeteer en Vercel

*   **Límites:** La generación de PDF consume mucha memoria. Hemos configurado `1024MB` en `vercel.json`, pero si el PDF es muy complejo, podría requerir optimización.
*   **Fuentes:** En entornos serverless Linux (como Vercel), las fuentes de Windows (como Cambria) no están instaladas por defecto. Puppeteer usará una fuente serif genérica de reemplazo.
    *   *Solución opcional:* Si la fuente exacta es crítica, se debe cargar el archivo `.ttf` de la fuente en el proyecto y configurarlo en el CSS con `@font-face`.

¡Listo! Tu aplicación debería estar funcionando en la nube.
