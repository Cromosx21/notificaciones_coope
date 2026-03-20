const parseDateInput = (value) => {
	if (value instanceof Date) return new Date(value.getTime());
	if (typeof value === "string") {
		const trimmed = value.trim();
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
		if (match) {
			const yyyy = Number(match[1]);
			const mm = Number(match[2]);
			const dd = Number(match[3]);
			return new Date(yyyy, mm - 1, dd);
		}
		return new Date(value);
	}
	return new Date(value);
};

const formatFechaLarga = (value) => {
	const d = parseDateInput(value);
	if (!Number.isFinite(d.getTime())) return "";
	return d.toLocaleDateString("es-PE", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

module.exports = { formatFechaLarga, parseDateInput };
