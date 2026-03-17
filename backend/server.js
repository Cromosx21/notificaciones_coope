const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const app = express();
const PORT = process.env.PORT || 5000;
const PHONE_CONTACT = process.env.LEGAL_CONTACT_PHONE || "";

process.on("uncaughtException", (err) => {
	console.error("uncaughtException", err);
});
process.on("unhandledRejection", (reason) => {
	console.error("unhandledRejection", reason);
});
process.on("exit", (code) => {
	console.error("process_exit", code);
});
console.log("env_VERCEL", Boolean(process.env.VERCEL));

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos (CSS)
app.use("/styles", express.static(path.join(__dirname, "templates")));

// Paths
const TEMPLATE_DIR = path.join(__dirname, "templates");
const FONT_REGULAR_PATH = path.join(__dirname, "fonts", "cambria.ttc");
const FONT_BOLD_PATH = path.join(__dirname, "fonts", "cambriab.ttf");

const parseMonto = (value) => {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value !== "string") {
		return 0;
	}
	const normalized = value.replace(/[^\d.-]/g, "");
	const num = Number(normalized);
	if (!Number.isFinite(num)) {
		return 0;
	}
	return num;
};

const formatMonto = (value) => {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};

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
	// La validación se ajustará más adelante según templateId

	try {
		console.log("Iniciando generación de PDF con Puppeteer...");

		const fontRegularBase64 = loadFontBase64(FONT_REGULAR_PATH);
		const fontBoldBase64 = loadFontBase64(FONT_BOLD_PATH);

		const montoBase = parseMonto(data.monto_total);
		const intereses = parseMonto(data.interes);
		const mora = parseMonto(data.mora);

		const totalJudicial = montoBase + 515 + 1200 + 600;

		const montoCondonado = intereses + mora;
		const montoConDescuento = montoBase - montoCondonado;

		const ahora = new Date();
		const fechaEmision = ahora.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
		const fechaLimiteDate = new Date(ahora.getTime());
		fechaLimiteDate.setDate(fechaLimiteDate.getDate() + 5);
		const fechaLimite = fechaLimiteDate.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});

		// Selección de plantilla
		let templateId = data.templateId;
		if (
			templateId === undefined ||
			templateId === null ||
			templateId === ""
		) {
			templateId = "1";
		} else {
			templateId = String(templateId);
		}

		const templateMap = {
			1: "1.ejs",
			2: "2.ejs",
			3: "3.ejs",
			4: "4.ejs",
		};

		const templateFile = templateMap[templateId] || templateMap["1"];
		const templatePath = path.join(TEMPLATE_DIR, templateFile);

		console.log("plantilla_seleccionada", {
			body: data,
			templateId,
			templateFile,
			templatePath,
		});

		// Validación específica por plantilla
		if (!data.nombre || !data.dni || !data.monto_total) {
			return res.status(400).json({
				error: "Faltan datos requeridos (nombre, dni, monto_total). Verifique el formulario.",
			});
		}
		if (templateId !== "3" && !data.plazo_horas) {
			return res.status(400).json({
				error: "Falta plazo_horas. Para las cartas 1, 2 y 4 es obligatorio.",
			});
		}

		const stylesPath = path.join(TEMPLATE_DIR, "styles.css");
		let inlineStyles = "";
		try {
			const stylesSource = fs.readFileSync(stylesPath, "utf8");
			inlineStyles = ejs.render(stylesSource, {
				fontRegularBase64: fontRegularBase64,
				fontBoldBase64: fontBoldBase64,
			});
		} catch (e) {
			console.error("error_styles_render", e);
			inlineStyles = "";
		}

		let html;
		try {
			html = await ejs.renderFile(templatePath, {
				nombre: data.nombre,
				dni: data.dni,
				direction: data.direction || "",
				monto_total: data.monto_total,
				plazo_horas: data.plazo_horas,
				fontRegularBase64: fontRegularBase64,
				fontBoldBase64: fontBoldBase64,
				monto_total_judicial: formatMonto(totalJudicial),
				interes_valor: formatMonto(intereses),
				mora_valor: formatMonto(mora),
				monto_condonado_total: formatMonto(montoCondonado),
				monto_con_descuento: formatMonto(montoConDescuento),
				fecha_emision: fechaEmision,
				fecha_limite: fechaLimite,
				inlineStyles: inlineStyles,
				telefono_contacto: PHONE_CONTACT,
			});
		} catch (e) {
			console.error("error_ejs_render", e);
			return res.status(500).json({
				error: "Error al renderizar la plantilla",
				details: e.message,
			});
		}

		// 3. Lanzar Puppeteer (Configuración compatible con Vercel)
		let browser;
		try {
			if (process.env.VERCEL) {
				const puppeteerCore = require("puppeteer-core");
				const chromium = require("@sparticuz/chromium");
				browser = await puppeteerCore.launch({
					args: chromium.args,
					defaultViewport: chromium.defaultViewport,
					executablePath: await chromium.executablePath(),
					headless: chromium.headless,
				});
			} else {
				const puppeteerLocal = require("puppeteer");
				browser = await puppeteerLocal.launch({
					headless: "new",
				});
			}
		} catch (e) {
			console.error("error_puppeteer_launch", e);
			return res.status(500).json({
				error: "Error al iniciar el motor de PDF. Verifique instalación de Puppeteer/Chromium.",
				details: e.message,
			});
		}

		const page = await browser.newPage();

		// 4. Cargar HTML en la página
		page.setDefaultNavigationTimeout(60000);
		await page.setContent(html, { waitUntil: "domcontentloaded" });

		// 5. Generar PDF con márgenes exactos
		let pdfBuffer;
		try {
			pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "5.75cm",
					right: "2.54cm",
					bottom: "2.54cm",
					left: "2.54cm",
				},
			});
		} catch (e) {
			console.error("error_pdf_generate", e);
			await browser.close().catch(() => {});
			return res.status(500).json({
				error: "Error al generar el PDF. Revise que los estilos/plantilla estén correctos.",
				details: e.message,
			});
		}

		await browser.close();
		console.log("PDF generado exitosamente.");

		// 6. Enviar el PDF al cliente
		res.setHeader("Content-Type", "application/pdf");
		const cartaLabels = {
			1: "Carta N° 001",
			2: "Carta N° 002",
			3: "Carta N° 003",
			4: "Carta N° 004",
		};
		const cartaLabel = cartaLabels[templateId] || "Carta N° 001";
		const humanName = String(data.nombre || "Documento");
		const utf8Name = `${cartaLabel} - ${humanName}`;
		const asciiName = utf8Name
			.replace(/[<>:"/\\|?*]+/g, "-")
			.replace(/[^\x20-\x7E]/g, "");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${encodeURIComponent(
				utf8Name,
			)}.pdf`,
		);
		res.send(Buffer.from(pdfBuffer));
	} catch (error) {
		console.error("Error procesando la solicitud:", error);
		res.status(500).json({
			error: "Error interno del servidor al generar el PDF.",
		});
	}
});

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

const startServer = (p) => {
	const srv = app.listen(p, () => {
		console.log(`Servidor corriendo en http://localhost:${p}`);
	});
	srv.on("error", (err) => {
		console.error("server_error", err);
		if (err && err.code === "EADDRINUSE") {
			const next = Number(p) + 1;
			startServer(next);
		}
	});
	srv.on("close", () => {
		console.error("server_close");
	});
	return srv;
};
startServer(PORT);
