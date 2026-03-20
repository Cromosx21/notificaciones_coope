const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");

const loadFontBase64 = (fontPath) => {
	try {
		if (fs.existsSync(fontPath)) {
			const fontBuffer = fs.readFileSync(fontPath);
			return fontBuffer.toString("base64");
		}
		return null;
	} catch (e) {
		console.error("error_load_font", e);
		return null;
	}
};

const createLogoBase64Loader = ({
	frontendLogoPath,
	fallbackDocxPath,
}) => {
	let cachedLogoBase64;

	return () => {
		if (cachedLogoBase64 !== undefined) return cachedLogoBase64;
		try {
			const logoPngPath = frontendLogoPath
				? path.resolve(frontendLogoPath)
				: null;
			if (logoPngPath && fs.existsSync(logoPngPath)) {
				cachedLogoBase64 = fs.readFileSync(logoPngPath).toString("base64");
				return cachedLogoBase64;
			}

			const docxPath = fallbackDocxPath ? path.resolve(fallbackDocxPath) : null;
			if (!docxPath || !fs.existsSync(docxPath)) {
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
};

module.exports = {
	loadFontBase64,
	createLogoBase64Loader,
};

