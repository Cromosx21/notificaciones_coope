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

export const montoATextoSoles = (value) => {
	const totalCents = Math.round((Number(value) || 0) * 100);
	const soles = Math.trunc(totalCents / 100);
	const cents = Math.abs(totalCents % 100);
	const moneda = soles === 1 ? "SOL" : "SOLES";
	const texto = toWordsEs(soles === 0 ? 0 : soles);
	return `${texto} CON ${String(cents).padStart(2, "0")}/100 ${moneda}`;
};

export const normalizeAmountInput = (value) => {
	const cleaned = String(value ?? "").replace(/,/g, "").replace(/[^\d.]/g, "");
	const [intPart, ...rest] = cleaned.split(".");
	const decimalPart = rest.length ? rest.join("") : undefined;
	return decimalPart === undefined ? intPart : `${intPart}.${decimalPart}`;
};

export const formatAmountInput = (rawValue) => {
	const value = String(rawValue ?? "");
	if (!value) return "";

	const endsWithDot = value.endsWith(".");
	const [rawInt = "", rawDec] = value.split(".");
	const intPart = rawInt === "" ? "0" : rawInt;
	const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

	if (endsWithDot) return `${formattedInt}.`;
	if (rawDec === undefined) return formattedInt;
	return `${formattedInt}.${rawDec}`;
};

export const parseAmountNumber = (rawValue) => {
	const n = Number(String(rawValue ?? ""));
	return Number.isFinite(n) ? n : 0;
};

