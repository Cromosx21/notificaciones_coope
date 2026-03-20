const { formatFechaLarga, parseDateInput } = require("./date");
const { formatMonto } = require("./money");

const buildCronograma = (firstDateValue, cuotasCount, totalValue) => {
	const cuotas = Math.max(0, Math.trunc(Number(cuotasCount) || 0));
	if (!cuotas) return [];
	const firstDate = parseDateInput(firstDateValue);
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

module.exports = { buildCronograma };
