const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const PizZip = require("pizzip");

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

const toWordsEs = (n) => {
	const num = Math.trunc(Number(n) || 0);
	if (num === 0) return "CERO";
	if (num < 0) return `MENOS ${toWordsEs(-num)}`;

	const unidades = [
		"",
		"UNO",
		"DOS",
		"TRES",
		"CUATRO",
		"CINCO",
		"SEIS",
		"SIETE",
		"OCHO",
		"NUEVE",
	];
	const especiales = {
		10: "DIEZ",
		11: "ONCE",
		12: "DOCE",
		13: "TRECE",
		14: "CATORCE",
		15: "QUINCE",
		16: "DIECISÉIS",
		17: "DIECISIETE",
		18: "DIECIOCHO",
		19: "DIECINUEVE",
		20: "VEINTE",
		21: "VEINTIUNO",
		22: "VEINTIDÓS",
		23: "VEINTITRÉS",
		24: "VEINTICUATRO",
		25: "VEINTICINCO",
		26: "VEINTISÉIS",
		27: "VEINTISIETE",
		28: "VEINTIOCHO",
		29: "VEINTINUEVE",
	};
	const decenas = [
		"",
		"",
		"VEINTE",
		"TREINTA",
		"CUARENTA",
		"CINCUENTA",
		"SESENTA",
		"SETENTA",
		"OCHENTA",
		"NOVENTA",
	];
	const centenas = [
		"",
		"CIENTO",
		"DOSCIENTOS",
		"TRESCIENTOS",
		"CUATROCIENTOS",
		"QUINIENTOS",
		"SEISCIENTOS",
		"SETECIENTOS",
		"OCHOCIENTOS",
		"NOVECIENTOS",
	];

	const twoDigits = (x) => {
		if (x < 10) return unidades[x];
		if (especiales[x]) return especiales[x];
		const tens = Math.trunc(x / 10);
		const unit = x % 10;
		if (tens === 2)
			return `VEINTI${unidades[unit].toLowerCase()}`.toUpperCase();
		return unit ? `${decenas[tens]} Y ${unidades[unit]}` : decenas[tens];
	};

	const threeDigits = (x) => {
		if (x === 0) return "";
		if (x === 100) return "CIEN";
		const hund = Math.trunc(x / 100);
		const rest = x % 100;
		const hundText = hund ? centenas[hund] : "";
		const restText = rest ? twoDigits(rest) : "";
		return [hundText, restText].filter(Boolean).join(" ").trim();
	};

	const section = (x) => {
		const thousands = Math.trunc(x / 1000);
		const rest = x % 1000;
		const parts = [];
		if (thousands) {
			if (thousands === 1) parts.push("MIL");
			else parts.push(`${threeDigits(thousands)} MIL`);
		}
		if (rest) parts.push(threeDigits(rest));
		return parts.join(" ").trim();
	};

	const millions = Math.trunc(num / 1_000_000);
	const rest = num % 1_000_000;
	const parts = [];
	if (millions) {
		if (millions === 1) parts.push("UN MILLÓN");
		else parts.push(`${section(millions)} MILLONES`);
	}
	if (rest) parts.push(section(rest));
	return parts.join(" ").trim();
};

const montoATextoSoles = (value) => {
	const totalCents = Math.round((Number(value) || 0) * 100);
	const soles = Math.trunc(totalCents / 100);
	const cents = Math.abs(totalCents % 100);
	const moneda = soles === 1 ? "SOL" : "SOLES";
	const texto = toWordsEs(soles === 0 ? 0 : soles);
	return `${texto} CON ${String(cents).padStart(2, "0")}/100 ${moneda}`;
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

const launchBrowser = async () => {
	if (process.env.VERCEL) {
		const puppeteerCore = require("puppeteer-core");
		const chromium = require("@sparticuz/chromium");
		return puppeteerCore.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
		});
	}

	const puppeteerLocal = require("puppeteer");
	return puppeteerLocal.launch({
		headless: "new",
	});
};

const TYPES_DIR = path.join(TEMPLATE_DIR, "types");
const TYPES_DOCX_COMPROMISO_PATH = path.join(
	TYPES_DIR,
	"COMPROMISO DE PAGO.docx",
);
const TYPES_DOCX_INFORME_PATH = path.join(
	TYPES_DIR,
	"INFORME DE GESTIÓN DE RECUPERACIONES.docx",
);

let cachedLogoBase64;
const loadLogoBase64 = () => {
	if (cachedLogoBase64 !== undefined) return cachedLogoBase64;
	try {
		const docxPath = fs.existsSync(TYPES_DOCX_COMPROMISO_PATH)
			? TYPES_DOCX_COMPROMISO_PATH
			: TYPES_DOCX_INFORME_PATH;
		if (!fs.existsSync(docxPath)) {
			cachedLogoBase64 = null;
			return cachedLogoBase64;
		}
		const zip = new PizZip(fs.readFileSync(docxPath));
		const img = zip.file("word/media/image1.png");
		if (!img) {
			cachedLogoBase64 = null;
			return cachedLogoBase64;
		}
		cachedLogoBase64 = img.asNodeBuffer().toString("base64");
		return cachedLogoBase64;
	} catch (e) {
		console.error("error_load_logo", e);
		cachedLogoBase64 = null;
		return cachedLogoBase64;
	}
};

const formatFechaLarga = (value) => {
	const d = value instanceof Date ? value : new Date(value);
	if (!Number.isFinite(d.getTime())) return "";
	return d.toLocaleDateString("es-PE", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

const buildCronograma = (firstDateValue, cuotasCount, totalValue) => {
	const cuotas = Math.max(0, Math.trunc(Number(cuotasCount) || 0));
	if (!cuotas) return [];
	const firstDate = new Date(firstDateValue);
	if (!Number.isFinite(firstDate.getTime())) return [];

	const totalCents = Math.round((Number(totalValue) || 0) * 100);
	const perCents = Math.trunc(totalCents / cuotas);

	const rows = [];
	for (let idx = 0; idx < cuotas; idx += 1) {
		const date = new Date(firstDate.getTime());
		date.setMonth(firstDate.getMonth() + idx);
		const cents =
			idx === cuotas - 1
				? totalCents - perCents * (cuotas - 1)
				: perCents;
		rows.push({
			cuota: String(idx + 1).padStart(2, "0"),
			fecha_vencimiento: formatFechaLarga(date),
			monto: formatMonto(cents / 100),
		});
	}
	return rows;
};

const buildHeaderTemplate = ({
	logoBase64,
	codigo,
	docType,
	fontRegularBase64,
	fontBoldBase64,
}) => {
	const logoHtml = logoBase64
		? `<img src="data:image/png;base64,${logoBase64}" style="height:56px; margin-right:10px;" />`
		: "";
	const safeCodigo = String(codigo || "")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	const codigoLabel =
		String(docType || "").toLowerCase() === "compromiso"
			? `ATE-RD Nº ${safeCodigo} /G.R.`
			: `IGR-Nº ${safeCodigo} /G.R.`;
	const fontStyle = `
<style>
@font-face {
	font-family: "CambriaRegularEmbed";
	src: url("data:font/collection;charset=utf-8;base64,${fontRegularBase64 || ""}") format("truetype-collection");
}
@font-face {
	font-family: "CambriaBoldEmbed";
	src: url("data:font/ttf;charset=utf-8;base64,${fontBoldBase64 || ""}") format("truetype");
}
</style>
`;
	return `
${fontStyle}
<div style="width:100%; font-family: CambriaRegularEmbed, Cambria, 'Times New Roman', serif; font-size:9.5pt; color:#000; padding:0 2.54cm; box-sizing:border-box; margin-top: 0.5cm;">
	<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; width:100%;">
		<div style="display:flex; align-items:flex-start; min-width:160px;">
			${logoHtml}
		</div>
		<div style="min-width:160px; width: fit-content; text-align:right; display:flex; flex-direction:column; align-items:flex-end;">
			<div>Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
			<div style="flex:1; text-align:right; line-height:1.1; margin-top:2px;">
				<div style="font-family: CambriaBoldEmbed, Cambria, 'Times New Roman', serif; font-size:9pt;">UNIDAD DE RECUPERACIONES JUDICIALES Y ASUNTOS LEGALES</div>
			</div>
			<div style="border:1px solid #000; display:inline-block; padding:2px 6px; margin-top:2px;">${codigoLabel}</div>
		</div>
	</div>
</div>
`;
};

const buildFooterTemplate = ({ fontRegularBase64, fontBoldBase64 }) => {
	const fontStyle = `
<style>
@font-face {
	font-family: "CambriaRegularEmbed";
	src: url("data:font/collection;charset=utf-8;base64,${fontRegularBase64 || ""}") format("truetype-collection");
}
@font-face {
	font-family: "CambriaBoldEmbed";
	src: url("data:font/ttf;charset=utf-8;base64,${fontBoldBase64 || ""}") format("truetype");
}
</style>
`;
	return `
${fontStyle}
<div style="width:100%; font-family: CambriaRegularEmbed, Cambria, 'Times New Roman', serif; font-size:9.5pt; color:#000; padding:0 2.54cm; box-sizing:border-box;">
	<div style="width:100%; text-align:center;">
	<strong>COOPAC NIÑO REY </strong> - Ayacucho, Perú - Sector Educacion Mz C lote 7-Pasaje los Amautas </br>
Ayacucho, Peru - Telf: 979 585 886
	</div>
</div>
`;
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
			browser = await launchBrowser();
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

app.post("/generate-document", async (req, res) => {
	const data = req.body || {};
	const docType = String(data.docType || "").toLowerCase();
	if (docType !== "compromiso" && docType !== "informe") {
		return res.status(400).json({
			error: 'docType inválido. Use "compromiso" o "informe".',
		});
	}

	const fontRegularBase64 = loadFontBase64(FONT_REGULAR_PATH) || "";
	const fontBoldBase64 = loadFontBase64(FONT_BOLD_PATH) || "";
	const logoBase64 = loadLogoBase64();

	const nombre = String(data.nombre || "").trim();
	const dni = String(data.dni || "").trim();
	const direction = String(data.direction || "").trim();

	if (!nombre || !dni) {
		return res.status(400).json({
			error: "Faltan datos requeridos (nombre, dni).",
		});
	}

	const ahora = new Date();
	const fechaEmision = data.fecha_emision
		? new Date(data.fecha_emision)
		: ahora;
	const fechaEmisionLarga = formatFechaLarga(fechaEmision);

	let templatePath;
	let templateVars;
	let filenameUtf8;

	if (docType === "compromiso") {
		const deudaTotal = parseMonto(data.deuda_total ?? data.monto_total);
		const montoPactado = parseMonto(data.monto_pactado);
		const cuotaInicial = parseMonto(data.cuota_inicial);
		const cuotas = Number(data.numero_cuotas || 0);

		if (!Number.isFinite(deudaTotal) || deudaTotal <= 0) {
			return res.status(400).json({
				error: "deuda_total inválido.",
			});
		}
		if (!Number.isFinite(montoPactado) || montoPactado <= 0) {
			return res.status(400).json({
				error: "monto_pactado inválido.",
			});
		}
		if (!Number.isFinite(cuotaInicial) || cuotaInicial < 0) {
			return res.status(400).json({
				error: "cuota_inicial inválido.",
			});
		}
		if (!Number.isFinite(cuotas) || cuotas <= 0) {
			return res.status(400).json({
				error: "numero_cuotas inválido.",
			});
		}

		const saldoFraccionado = Math.max(0, montoPactado - cuotaInicial);
		const cronograma = buildCronograma(
			data.fecha_primera_cuota || fechaEmision,
			cuotas,
			saldoFraccionado,
		);

		const montoCondonado = Math.max(0, deudaTotal - montoPactado);

		templatePath = path.join(TYPES_DIR, "compromiso.ejs");
		const codigoBase = String(data.codigo || "").trim() || "001-2026";
		templateVars = {
			fontRegularBase64,
			fontBoldBase64,
			logoBase64,
			codigo: codigoBase,
			nombre,
			dni,
			direction,
			fecha_emision_larga: fechaEmisionLarga,
			fecha_credito_larga: formatFechaLarga(
				data.fecha_credito || fechaEmision,
			),
			deuda_total: formatMonto(deudaTotal),
			monto_pactado: formatMonto(montoPactado),
			monto_condonado: formatMonto(montoCondonado),
			cuota_inicial: formatMonto(cuotaInicial),
			saldo_fraccionado: formatMonto(saldoFraccionado),
			numero_cuotas: String(cuotas).padStart(2, "0"),
			cronograma,
			total_cronograma: formatMonto(saldoFraccionado),
		};
		filenameUtf8 = `Compromiso de Pago - ${nombre}`;
	} else {
		const deudaTotal = parseMonto(data.deuda_total ?? data.monto_total);
		const saldoCapital = parseMonto(data.saldo_capital);
		const interesComp = parseMonto(data.interes_compensatorio);
		const interesMora = parseMonto(data.interes_moratorio);
		const otrosCargos = parseMonto(data.otros_cargos);

		if (!Number.isFinite(deudaTotal) || deudaTotal <= 0) {
			return res.status(400).json({
				error: "deuda_total inválido.",
			});
		}

		const condonarInteres = Boolean(data.condonar_interes_compensatorio);
		const condonarMora =
			data.condonar_interes_moratorio === undefined
				? true
				: Boolean(data.condonar_interes_moratorio);
		const condonarOtros = Boolean(data.condonar_otros_cargos);

		const condonarInteresMonto = parseMonto(
			data.condonar_interes_compensatorio_monto,
		);
		const condonarMoraMonto = parseMonto(
			data.condonar_interes_moratorio_monto,
		);
		const condonarOtrosMonto = parseMonto(data.condonar_otros_cargos_monto);

		const condonadoInteresValue =
			Number.isFinite(condonarInteresMonto) && condonarInteresMonto > 0
				? Math.min(condonarInteresMonto, interesComp)
				: condonarInteres
					? interesComp
					: 0;
		const condonadoMoraValue =
			Number.isFinite(condonarMoraMonto) && condonarMoraMonto > 0
				? Math.min(condonarMoraMonto, interesMora)
				: condonarMora
					? interesMora
					: 0;
		const condonadoOtrosValue =
			Number.isFinite(condonarOtrosMonto) && condonarOtrosMonto > 0
				? Math.min(condonarOtrosMonto, otrosCargos)
				: condonarOtros
					? otrosCargos
					: 0;

		const montoCondonado = Math.max(
			0,
			condonadoInteresValue + condonadoMoraValue + condonadoOtrosValue,
		);
		const montoPactado = Math.max(0, deudaTotal - montoCondonado);

		const cuotaInicial = parseMonto(data.cuota_inicial);
		const cuotas = Number(data.numero_cuotas || 0);
		if (!Number.isFinite(cuotas) || cuotas <= 0) {
			return res.status(400).json({
				error: "numero_cuotas inválido.",
			});
		}
		if (!Number.isFinite(cuotaInicial) || cuotaInicial < 0) {
			return res.status(400).json({
				error: "cuota_inicial inválido.",
			});
		}
		const saldoFraccionado = Math.max(0, montoPactado - cuotaInicial);
		const cronograma = buildCronograma(
			data.fecha_primera_cuota || fechaEmision,
			cuotas,
			saldoFraccionado,
		);

		const numeroInforme = String(data.numero_informe || "007").trim();
		const codigoBase =
			String(data.codigo || "").trim() || `${numeroInforme}-2026`;
		templatePath = path.join(TYPES_DIR, "informe.ejs");
		const diasAtrasoRaw = String(data.dias_atraso ?? "").trim();
		const diasAtraso = diasAtrasoRaw
			? diasAtrasoRaw.replace(/[^\d]/g, "") || "0"
			: "0";
		const cuotaMensual =
			cuotas > 0
				? formatMonto(saldoFraccionado / cuotas)
				: formatMonto(0);
		templateVars = {
			fontRegularBase64,
			fontBoldBase64,
			logoBase64,
			codigo: codigoBase,
			numero_informe: numeroInforme,
			nombre,
			dni,
			direction,
			fecha_emision_larga: fechaEmisionLarga,
			para: String(
				data.para ||
					"Administración de Créditos / Gerencia de Recuperaciones",
			),
			de: String(data.de || "Gestor de Recuperaciones"),
			asunto: String(
				data.asunto ||
					`Solicitud de Condonación de Mora - Socio ${nombre}`,
			),
			deuda_total: formatMonto(deudaTotal),
			deuda_total_texto: montoATextoSoles(deudaTotal),
			dias_atraso: diasAtraso,
			estado_deuda: String(data.estado_deuda || "Cartera Castigada"),
			fecha_credito_larga: formatFechaLarga(
				data.fecha_credito || fechaEmision,
			),
			saldo_capital: formatMonto(saldoCapital),
			interes_compensatorio: formatMonto(interesComp),
			interes_moratorio: formatMonto(interesMora),
			otros_cargos: formatMonto(otrosCargos),
			beneficio_condonado: formatMonto(montoCondonado),
			interes_condonado: formatMonto(condonadoInteresValue),
			mora_condonada: formatMonto(condonadoMoraValue),
			monto_pactado: formatMonto(montoPactado),
			cuota_inicial: formatMonto(cuotaInicial),
			saldo_fraccionado: formatMonto(saldoFraccionado),
			cuota_mensual: cuotaMensual,
			numero_cuotas: String(cuotas).padStart(2, "0"),
			cronograma,
			total_cronograma: formatMonto(saldoFraccionado),
			fecha_reprogramacion_larga: formatFechaLarga(
				data.fecha_reprogramacion || fechaEmision,
			),
			acta_transaccion: String(
				data.acta_transaccion || "000-2026",
			).trim(),
			fecha_acta_transaccion: formatFechaLarga(
				data.fecha_acta_transaccion || fechaEmision,
			),
		};
		filenameUtf8 = `Informe de Gestión - ${nombre}`;
	}

	let html;
	try {
		html = await ejs.renderFile(templatePath, templateVars);
	} catch (e) {
		console.error("error_ejs_render_document", e);
		return res.status(500).json({
			error: "Error al renderizar la plantilla del documento",
			details: e.message,
		});
	}

	let browser;
	try {
		browser = await launchBrowser();
	} catch (e) {
		console.error("error_puppeteer_launch_document", e);
		return res.status(500).json({
			error: "Error al iniciar el motor de PDF.",
			details: e.message,
		});
	}

	const page = await browser.newPage();
	page.setDefaultNavigationTimeout(60000);
	await page.setContent(html, { waitUntil: "domcontentloaded" });

	const headerTemplate = buildHeaderTemplate({
		logoBase64,
		codigo: templateVars.codigo,
		docType,
		fontRegularBase64,
		fontBoldBase64,
	});
	const footerTemplate = buildFooterTemplate({
		fontRegularBase64,
		fontBoldBase64,
	});

	let pdfBuffer;
	try {
		pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
			displayHeaderFooter: true,
			headerTemplate,
			footerTemplate,
			margin: {
				top: "4.2cm",
				right: "2.54cm",
				bottom: "2.8cm",
				left: "2.54cm",
			},
		});
	} catch (e) {
		console.error("error_pdf_generate_document", e);
		await browser.close().catch(() => {});
		return res.status(500).json({
			error: "Error al generar el PDF del documento.",
			details: e.message,
		});
	}

	await browser.close();

	res.setHeader("Content-Type", "application/pdf");
	const asciiName = filenameUtf8
		.replace(/[<>:"/\\|?*]+/g, "-")
		.replace(/[^\x20-\x7E]/g, "");
	res.setHeader(
		"Content-Disposition",
		`attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${encodeURIComponent(
			filenameUtf8,
		)}.pdf`,
	);
	res.send(Buffer.from(pdfBuffer));
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
