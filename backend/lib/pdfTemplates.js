const escapeHtml = (v) => {
	return String(v || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const buildFontStyle = ({ fontRegularBase64, fontBoldBase64 }) => {
	return `
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
	const safeCodigo = escapeHtml(codigo);
	const codigoLabel =
		String(docType || "").toLowerCase() === "compromiso"
			? `ATE-RD Nº ${safeCodigo} /G.R.`
			: `IGR-Nº ${safeCodigo} /G.R.`;
	const fontStyle = buildFontStyle({ fontRegularBase64, fontBoldBase64 });
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
	const fontStyle = buildFontStyle({ fontRegularBase64, fontBoldBase64 });
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

module.exports = {
	buildHeaderTemplate,
	buildFooterTemplate,
};

