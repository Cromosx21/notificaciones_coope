# Notificaciones — Generador de PDFs

Aplicación web para generar documentos PDF a partir de plantillas HTML (EJS) con firma visual corporativa (logo + Cambria embebida).

Incluye:

- Notificaciones (Cartas 1–4).
- Documentación: Compromiso de Pago e Informe de Gestión.

## Stack

- Frontend: React + Vite.
- Backend: Node.js + Express.
- Plantillas: EJS.
- PDF: Puppeteer (local) / puppeteer-core + @sparticuz/chromium (Vercel).

## Estructura

- `backend/`
    - `server.js`: API de generación.
    - `lib/`: utilidades (fechas, montos, cronograma, assets, plantillas PDF).
    - `templates/`: plantillas EJS de notificaciones y documentación.
    - `fonts/`: Cambria embebida (`cambria.ttc`, `cambriab.ttf`).
- `frontend/`
    - `src/components/`: UI y formularios.
    - `src/components/documentation/`: wizard por steps (Compromiso/Informe).

## Requisitos

- Node.js (recomendado 18+).

## Instalación

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuración (env)

- Frontend:
    - `VITE_API_URL` (opcional). Si no se define, en desarrollo intenta `http://localhost:5000` y luego `http://localhost:5001`.
- Backend:
    - `PORT` (opcional, default 5000; si está ocupado intenta 5001, 5002, ...).
    - `LEGAL_CONTACT_PHONE` (opcional, se inyecta en algunas notificaciones).

## Endpoints principales

- `POST /generate-pdf` (Notificaciones)
    - Body esperado (resumen): `templateId`, `nombre`, `dni`, `direction`, `monto_total`, `plazo_horas` (según carta), `interes`, `mora`.
- `POST /generate-document` (Documentación)
    - Body esperado (resumen): `docType` (`compromiso` | `informe`) y campos del wizard.

## Notas

- Para fechas de inputs HTML se envía `YYYY-MM-DD`. El backend las interpreta como fecha local para evitar desfases por zona horaria.
- En Informe, el documento se dirige siempre a: `Administración de créditos / Gerencia de recuperaciones`.

## Despliegue (Vercel)

- El backend está preparado para serverless (usa `puppeteer-core` + `@sparticuz/chromium` cuando `VERCEL` está activo) y cuenta con `backend/vercel.json`.
- En Vercel, configura `VITE_API_URL` en el frontend con la URL pública del backend.
