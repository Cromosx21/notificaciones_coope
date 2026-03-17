# Sistema de Notificaciones PDF

Este proyecto es un microservicio para generar PDFs a partir de plantillas de Word (.docx), rellenando datos desde un formulario web.

## Requisitos Previos

1.  **Node.js** instalado (v14 o superior).
2.  **LibreOffice** instalado en el sistema (necesario para la conversión a PDF).
    *   Asegúrate de que el comando `soffice` o `libreoffice` esté accesible en tu PATH, o configura la ruta en `libreoffice-convert`.
    *   En Windows, suele funcionar automáticamente si se instaló en la ruta por defecto.

## Estructura del Proyecto

*   `backend/`: Servidor Node.js/Express.
    *   `templates/`: Carpeta donde debes colocar tu plantilla `.docx`.
    *   `output/`: Carpeta temporal donde se generan los archivos.
    *   `server.js`: Lógica del servidor.
*   `frontend/`: Aplicación React + Vite.
    *   `src/components/GeneratorForm.jsx`: Formulario de entrada de datos.

## Configuración de la Plantilla Word (.docx)

1.  Crea un archivo de Word (`.docx`).
2.  Usa la sintaxis `{nombre_variable}` para los campos que quieras reemplazar.
3.  Variables disponibles en el formulario actual:
    *   `{nombre}`
    *   `{dni}`
    *   `{monto_total}`
    *   `{plazo_pago}`
    *   `{fecha_actual}` (se genera automáticamente)
4.  Guarda el archivo como `template.docx`.
5.  Mueve el archivo a la carpeta `backend/templates/`.

## Instalación y Ejecución

### 1. Backend

```bash
cd backend
npm install
# Iniciar servidor
node server.js
```
El servidor correrá en `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
# Iniciar aplicación web
npm run dev
```
La aplicación correrá en `http://localhost:5173` (o el puerto que indique Vite).

## Uso

1.  Abre la aplicación web.
2.  Rellena los datos del formulario.
3.  Haz clic en "Generar y Descargar PDF".
4.  Si todo es correcto, se descargará el PDF generado.

## Notas Técnicas

*   Se utiliza `docxtemplater` para reemplazar las variables en el `.docx`.
*   Se utiliza `libreoffice-convert` para convertir el `.docx` modificado a `.pdf`.
*   Si obtienes un error de conversión, verifica la instalación de LibreOffice.
