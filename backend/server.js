const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const ejs = require("ejs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Paths
const TEMPLATE_DIR = path.join(__dirname, "templates");
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, "template.ejs");
const FONT_REGULAR_PATH = path.join(__dirname, "fonts", "cambria.ttc");
const FONT_BOLD_PATH = path.join(__dirname, "fonts", "cambriab.ttf");

// Helper to load font as base64
const loadFontBase64 = (fontPath) => {
	try {
		if (fs.existsSync(fontPath)) {
			const fontBuffer = fs.readFileSync(fontPath);
			return fontBuffer.toString("base64");
		}
		return null;
	} catch (e) {
		console.error("Error loading font:", e);
		return null;
	}
};

// Endpoint to generate PDF
app.post("/generate-pdf", async (req, res) => {
	const data = req.body;

	// 1. Validar datos
	if (!data.nombre || !data.dni || !data.monto_total || !data.plazo_horas) {
		return res.status(400).json({
			error: "Faltan datos requeridos (nombre, dni, monto_total, plazo_horas).",
		});
	}

	try {
		console.log("Iniciando generación de PDF con Puppeteer...");

		// Cargar fuentes
		const fontRegularBase64 = loadFontBase64(FONT_REGULAR_PATH);
		const fontBoldBase64 = loadFontBase64(FONT_BOLD_PATH);

		// 2. Renderizar HTML con EJS
		const html = await ejs.renderFile(TEMPLATE_PATH, {
			nombre: data.nombre,
			dni: data.dni,
			direction: data.direction || "",
			monto_total: data.monto_total,
			plazo_horas: data.plazo_horas,
			fontRegularBase64: fontRegularBase64,
			fontBoldBase64: fontBoldBase64,
		});

		// 3. Lanzar Puppeteer (Configuración compatible con Vercel)
		let browser;
		if (process.env.VERCEL) {
			// Configuración para producción en Vercel
			browser = await puppeteer.launch({
				args: chromium.args,
				defaultViewport: chromium.defaultViewport,
				executablePath: await chromium.executablePath(),
				headless: chromium.headless,
			});
		} else {
			// Configuración para desarrollo local
			// Necesitamos 'puppeteer' completo instalado localmente o usar la ruta de Chrome local
			const puppeteerLocal = require("puppeteer");
			browser = await puppeteerLocal.launch({
				headless: "new",
			});
		}

		const page = await browser.newPage();

		// 4. Cargar HTML en la página
		await page.setContent(html, { waitUntil: "networkidle0" });

		// 5. Generar PDF con márgenes exactos
		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: {
				top: "5.75cm",
				right: "2.54cm",
				bottom: "2.54cm",
				left: "2.54cm",
			},
		});

		await browser.close();
		console.log("PDF generado exitosamente.");

		// 6. Enviar el PDF al cliente
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			"attachment; filename=documento_generado.pdf",
		);
		res.send(Buffer.from(pdfBuffer));
	} catch (error) {
		console.error("Error procesando la solicitud:", error);
		res.status(500).json({
			error: "Error interno del servidor al generar el PDF.",
		});
	}
});

app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
