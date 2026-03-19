import React, { useMemo, useState } from "react";
import axios from "axios";

const Section = ({ title, description, children }) => (
	<div className="bg-gray-900/20 border border-gray-700/60 rounded-2xl p-5">
		<div className="mb-4">
			<div className="text-sm font-bold text-white tracking-wide">
				{title}
			</div>
			{description ? (
				<div className="text-xs text-gray-400 mt-1">{description}</div>
			) : null}
		</div>
		<div className="space-y-5">{children}</div>
	</div>
);

const DocumentationForm = () => {
	const todayIso = useMemo(() => {
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		return `${yyyy}-${mm}-${dd}`;
	}, []);

	const initialFormData = {
		docType: "compromiso",
		apellidos: "",
		nombres: "",
		dni: "",
		direction: "",
		fecha_emision: todayIso,
		codigo: "",
		fecha_credito: todayIso,
		fecha_primera_cuota: todayIso,
		deuda_total: "",
		monto_pactado: "",
		cuota_inicial: "",
		numero_cuotas: "4",
		numero_informe: "007",
		para: "",
		de: "",
		asunto: "",
		dias_atraso: "",
		estado_deuda: "",
		saldo_capital: "",
		interes_compensatorio: "",
		interes_moratorio: "",
		otros_cargos: "",
		condonar_interes_compensatorio: false,
		condonar_interes_moratorio: true,
		condonar_otros_cargos: false,
		condonar_interes_compensatorio_monto: "",
		condonar_interes_moratorio_monto: "",
		condonar_otros_cargos_monto: "",
		fecha_reprogramacion: todayIso,
		acta_transaccion: "",
		fecha_acta_transaccion: todayIso,
	};

	const [formData, setFormData] = useState(initialFormData);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);

	const chooseApiBase = async () => {
		if (import.meta.env.DEV) {
			try {
				await axios.get("http://localhost:5000/health", {
					timeout: 2000,
				});
				return "http://localhost:5000";
			} catch (_e) {
				void _e;
			}
			try {
				await axios.get("http://localhost:5001/health", {
					timeout: 2000,
				});
				return "http://localhost:5001";
			} catch (_e) {
				void _e;
			}
		}
		return import.meta.env.VITE_API_URL || "http://localhost:5000";
	};

	const normalizeAmountInput = (value) => {
		const cleaned = String(value ?? "")
			.replace(/,/g, "")
			.replace(/[^\d.]/g, "");
		const [intPart, ...rest] = cleaned.split(".");
		const decimalPart = rest.length ? rest.join("") : undefined;
		return decimalPart === undefined
			? intPart
			: `${intPart}.${decimalPart}`;
	};

	const formatAmountInput = (rawValue) => {
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

	const parseAmountNumber = (rawValue) => {
		const n = Number(String(rawValue ?? ""));
		return Number.isFinite(n) ? n : 0;
	};

	const computed = useMemo(() => {
		const deudaTotal = parseAmountNumber(formData.deuda_total);
		const cuotaInicial = parseAmountNumber(formData.cuota_inicial);
		let montoPactado;
		if (formData.docType === "compromiso") {
			montoPactado = parseAmountNumber(formData.monto_pactado);
		} else {
			const interesComp = parseAmountNumber(
				formData.interes_compensatorio,
			);
			const interesMora = parseAmountNumber(formData.interes_moratorio);
			const otrosCargos = parseAmountNumber(formData.otros_cargos);

			const condInteresMontoRaw = parseAmountNumber(
				formData.condonar_interes_compensatorio_monto,
			);
			const condMoraMontoRaw = parseAmountNumber(
				formData.condonar_interes_moratorio_monto,
			);
			const condOtrosMontoRaw = parseAmountNumber(
				formData.condonar_otros_cargos_monto,
			);

			const condInteres =
				condInteresMontoRaw > 0
					? Math.min(condInteresMontoRaw, interesComp)
					: formData.condonar_interes_compensatorio
						? interesComp
						: 0;
			const condMora =
				condMoraMontoRaw > 0
					? Math.min(condMoraMontoRaw, interesMora)
					: formData.condonar_interes_moratorio
						? interesMora
						: 0;
			const condOtros =
				condOtrosMontoRaw > 0
					? Math.min(condOtrosMontoRaw, otrosCargos)
					: formData.condonar_otros_cargos
						? otrosCargos
						: 0;

			const montoCondonado = Math.max(
				0,
				condInteres + condMora + condOtros,
			);
			montoPactado = Math.max(0, deudaTotal - montoCondonado);
		}
		const saldoFraccionado = Math.max(0, montoPactado - cuotaInicial);
		const cuotasCount = Math.max(
			0,
			Math.trunc(Number(formData.numero_cuotas) || 0),
		);
		const cuotaMensual =
			cuotasCount > 0 ? saldoFraccionado / cuotasCount : 0;
		const montoCondonado = Math.max(0, deudaTotal - montoPactado);
		return {
			deudaTotal,
			montoPactado,
			montoCondonado,
			cuotaInicial,
			saldoFraccionado,
			cuotasCount,
			cuotaMensual,
		};
	}, [
		formData.cuota_inicial,
		formData.deuda_total,
		formData.docType,
		formData.interes_compensatorio,
		formData.interes_moratorio,
		formData.monto_pactado,
		formData.numero_cuotas,
		formData.otros_cargos,
		formData.condonar_interes_compensatorio,
		formData.condonar_interes_moratorio,
		formData.condonar_otros_cargos,
		formData.condonar_interes_compensatorio_monto,
		formData.condonar_interes_moratorio_monto,
		formData.condonar_otros_cargos_monto,
	]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		if (name === "docType") {
			setFormData({
				...initialFormData,
				docType: value,
				apellidos: formData.apellidos,
				nombres: formData.nombres,
				dni: formData.dni,
				direction: formData.direction,
			});
			setMessage(null);
			return;
		}

		if (
			name === "deuda_total" ||
			name === "monto_pactado" ||
			name === "cuota_inicial" ||
			name === "saldo_capital" ||
			name === "interes_compensatorio" ||
			name === "interes_moratorio" ||
			name === "otros_cargos" ||
			name === "condonar_interes_compensatorio_monto" ||
			name === "condonar_interes_moratorio_monto" ||
			name === "condonar_otros_cargos_monto"
		) {
			const montoToCheckbox = {
				condonar_interes_compensatorio_monto:
					"condonar_interes_compensatorio",
				condonar_interes_moratorio_monto: "condonar_interes_moratorio",
				condonar_otros_cargos_monto: "condonar_otros_cargos",
			};
			const checkboxName = montoToCheckbox[name];
			const normalized = normalizeAmountInput(value);
			setFormData({
				...formData,
				[name]: normalized,
				...(checkboxName && normalized
					? { [checkboxName]: false }
					: {}),
			});
			return;
		}

		if (type === "checkbox") {
			const checkboxToMonto = {
				condonar_interes_compensatorio:
					"condonar_interes_compensatorio_monto",
				condonar_interes_moratorio: "condonar_interes_moratorio_monto",
				condonar_otros_cargos: "condonar_otros_cargos_monto",
			};
			const montoName = checkboxToMonto[name];
			setFormData({
				...formData,
				[name]: checked,
				...(checked && montoName ? { [montoName]: "" } : {}),
			});
			return;
		}

		setFormData({
			...formData,
			[name]: value,
		});
	};

	const downloadFromResponse = (response, fallbackFilename) => {
		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement("a");
		link.href = url;
		let filenameFromHeader;
		const cd = response.headers && response.headers["content-disposition"];
		if (cd) {
			const matchStar = /filename\*=UTF-8''([^;]+)/i.exec(cd);
			const matchBasic = /filename="?([^";]+)"?/i.exec(cd);
			if (matchStar && matchStar[1]) {
				try {
					filenameFromHeader = decodeURIComponent(matchStar[1]);
				} catch (_e) {
					void _e;
				}
			} else if (matchBasic && matchBasic[1]) {
				filenameFromHeader = matchBasic[1];
			}
		}
		link.setAttribute("download", filenameFromHeader || fallbackFilename);
		document.body.appendChild(link);
		link.click();
		link.remove();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage(null);

		try {
			const API_URL = await chooseApiBase();
			const nombre =
				`${formData.apellidos} ${formData.nombres}`.toUpperCase();

			const payload = {
				docType: formData.docType,
				nombre,
				dni: formData.dni,
				direction: formData.direction.toUpperCase(),
				fecha_emision: formData.fecha_emision,
				codigo: formData.codigo || undefined,
				fecha_credito: formData.fecha_credito,
				fecha_primera_cuota: formData.fecha_primera_cuota,
				deuda_total: computed.deudaTotal,
				monto_pactado:
					formData.docType === "compromiso"
						? computed.montoPactado
						: undefined,
				cuota_inicial: computed.cuotaInicial,
				numero_cuotas: computed.cuotasCount,
				numero_informe:
					formData.docType === "informe"
						? formData.numero_informe
						: undefined,
				para:
					formData.docType === "informe" ? formData.para : undefined,
				de: formData.docType === "informe" ? formData.de : undefined,
				asunto:
					formData.docType === "informe"
						? formData.asunto
						: undefined,
				dias_atraso:
					formData.docType === "informe"
						? formData.dias_atraso
						: undefined,
				estado_deuda:
					formData.docType === "informe"
						? formData.estado_deuda
						: undefined,
				saldo_capital:
					formData.docType === "informe"
						? parseAmountNumber(formData.saldo_capital)
						: undefined,
				interes_compensatorio:
					formData.docType === "informe"
						? parseAmountNumber(formData.interes_compensatorio)
						: undefined,
				interes_moratorio:
					formData.docType === "informe"
						? parseAmountNumber(formData.interes_moratorio)
						: undefined,
				otros_cargos:
					formData.docType === "informe"
						? parseAmountNumber(formData.otros_cargos)
						: undefined,
				condonar_interes_compensatorio_monto:
					formData.docType === "informe"
						? parseAmountNumber(
								formData.condonar_interes_compensatorio_monto,
							)
						: undefined,
				condonar_interes_moratorio_monto:
					formData.docType === "informe"
						? parseAmountNumber(
								formData.condonar_interes_moratorio_monto,
							)
						: undefined,
				condonar_otros_cargos_monto:
					formData.docType === "informe"
						? parseAmountNumber(
								formData.condonar_otros_cargos_monto,
							)
						: undefined,
				condonar_interes_compensatorio:
					formData.docType === "informe"
						? formData.condonar_interes_compensatorio
						: undefined,
				condonar_interes_moratorio:
					formData.docType === "informe"
						? formData.condonar_interes_moratorio
						: undefined,
				condonar_otros_cargos:
					formData.docType === "informe"
						? formData.condonar_otros_cargos
						: undefined,
				fecha_reprogramacion:
					formData.docType === "informe"
						? formData.fecha_reprogramacion
						: undefined,
				acta_transaccion:
					formData.docType === "informe"
						? formData.acta_transaccion
						: undefined,
				fecha_acta_transaccion:
					formData.docType === "informe"
						? formData.fecha_acta_transaccion
						: undefined,
			};

			let response;
			try {
				response = await axios.post(
					`${API_URL}/generate-document`,
					payload,
					{ responseType: "blob" },
				);
			} catch (err) {
				if (API_URL === "http://localhost:5000" && err.request) {
					response = await axios.post(
						`http://localhost:5001/generate-document`,
						payload,
						{ responseType: "blob" },
					);
				} else {
					throw err;
				}
			}

			const fallback =
				formData.docType === "compromiso"
					? `Compromiso de Pago - ${nombre}.pdf`
					: `Informe de Gestión - ${nombre}.pdf`;
			downloadFromResponse(response, fallback);

			setMessage({
				type: "success",
				text: "Documento generado y descargado con éxito.",
			});
		} catch (error) {
			console.error("Error:", error);
			let errorMsg = "Error al conectar con el servidor.";

			if (error.response) {
				errorMsg =
					error.response.data instanceof Blob
						? "Error al generar el documento (Revisa la consola del servidor)"
						: error.response.data.error ||
							`Error del servidor: ${error.response.status}`;

				if (error.response.data instanceof Blob) {
					try {
						const text = await error.response.data.text();
						const json = JSON.parse(text);
						if (json.error) errorMsg = json.error;
					} catch (e) {
						void e;
					}
				}
			} else if (error.request) {
				errorMsg =
					"No se recibió respuesta. Verifica que el backend esté corriendo en el puerto 5000.";
			} else {
				errorMsg = error.message;
			}

			setMessage({
				type: "error",
				text: errorMsg,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<div className="mb-8 text-center">
				<h2 className="text-2xl font-bold text-white tracking-tight">
					Documentación
				</h2>
				<p className="text-gray-400 text-sm mt-2">
					Genera Compromiso de Pago o Informe de Gestión
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Section
					title="Documento"
					description="Selecciona el tipo y completa los datos del encabezado."
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Tipo de Documento
							</label>
							<select
								name="docType"
								value={formData.docType}
								onChange={handleChange}
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
							>
								<option value="compromiso">
									Compromiso de Pago
								</option>
								<option value="informe">
									Informe de Gestión
								</option>
							</select>
						</div>
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Fecha Emisión
							</label>
							<input
								type="date"
								name="fecha_emision"
								value={formData.fecha_emision}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Código (opcional)
							</label>
							<input
								type="text"
								name="codigo"
								value={formData.codigo}
								onChange={handleChange}
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder={
									formData.docType === "compromiso"
										? "001-2026"
										: "007-2026"
								}
							/>
						</div>
						{formData.docType === "informe" ? (
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									N° Informe
								</label>
								<input
									type="text"
									name="numero_informe"
									value={formData.numero_informe}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="001"
								/>
							</div>
						) : (
							<div className="group" />
						)}
					</div>
				</Section>

				<Section
					title="Información del socio"
					description="Datos principales del socio/deudor."
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Apellidos
							</label>
							<input
								type="text"
								name="apellidos"
								value={formData.apellidos}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder="Ej. PÉREZ GARCÍA"
							/>
						</div>
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Nombres
							</label>
							<input
								type="text"
								name="nombres"
								value={formData.nombres}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder="Ej. JUAN CARLOS"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								DNI
							</label>
							<input
								type="text"
								name="dni"
								value={formData.dni}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder="Ej. 12345678"
							/>
						</div>
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Domicilio
							</label>
							<input
								type="text"
								name="direction"
								value={formData.direction}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder="Ej. Av. Los Próceres 123 - Ayacucho"
							/>
						</div>
					</div>
				</Section>

				<Section
					title="Estado del crédito"
					description="Datos base para el cálculo y la redacción."
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Fecha crédito
							</label>
							<input
								type="date"
								name="fecha_credito"
								value={formData.fecha_credito}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
							/>
						</div>
						{formData.docType === "informe" ? (
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Días de atraso
								</label>
								<input
									type="text"
									name="dias_atraso"
									value={formData.dias_atraso}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="1000"
								/>
							</div>
						) : (
							<div className="group" />
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Deuda Total (S/)
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
									S/
								</span>
								<input
									type="text"
									inputMode="decimal"
									name="deuda_total"
									value={formatAmountInput(
										formData.deuda_total,
									)}
									onChange={handleChange}
									required
									className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="0.00"
								/>
							</div>
						</div>
						{formData.docType === "informe" ? (
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Estado de la deuda
								</label>
								<input
									type="text"
									name="estado_deuda"
									value={formData.estado_deuda}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="Cartera Castigada"
								/>
							</div>
						) : (
							<div className="group" />
						)}
					</div>
				</Section>

				{formData.docType === "compromiso" ? (
					<Section
						title="Saneamiento"
						description="Monto pactado y beneficio de condonación."
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Monto pactado (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="monto_pactado"
										value={formatAmountInput(
											formData.monto_pactado,
										)}
										onChange={handleChange}
										required
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
								<div className="text-gray-400 text-xs uppercase tracking-wider">
									Condonado (estimado)
								</div>
								<div className="mt-2 font-bold text-white">
									S/ {computed.montoCondonado.toFixed(2)}
								</div>
							</div>
						</div>
					</Section>
				) : (
					<Section
						title="Informe y condonación"
						description="Datos del informe y estructura de condonación por conceptos."
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Fecha reprogramación
								</label>
								<input
									type="date"
									name="fecha_reprogramacion"
									value={formData.fecha_reprogramacion}
									onChange={handleChange}
									required
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
								/>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Asunto (opcional)
								</label>
								<input
									type="text"
									name="asunto"
									value={formData.asunto}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="Solicitud de Condonación de Mora"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Acta transacción (N°)
								</label>
								<input
									type="text"
									name="acta_transaccion"
									value={formData.acta_transaccion}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="N° 000-2026"
								/>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Fecha acta transacción
								</label>
								<input
									type="date"
									name="fecha_acta_transaccion"
									value={formData.fecha_acta_transaccion}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									A (opcional)
								</label>
								<input
									type="text"
									name="para"
									value={formData.para}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="Administración de Créditos / Gerencia"
								/>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									De (opcional)
								</label>
								<input
									type="text"
									name="de"
									value={formData.de}
									onChange={handleChange}
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="Gestor de Recuperaciones"
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Saldo Capital (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="saldo_capital"
										value={formatAmountInput(
											formData.saldo_capital,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Interés Compensatorio (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="interes_compensatorio"
										value={formatAmountInput(
											formData.interes_compensatorio,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Interés Moratorio (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="interes_moratorio"
										value={formatAmountInput(
											formData.interes_moratorio,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Otros cargos (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="otros_cargos"
										value={formatAmountInput(
											formData.otros_cargos,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Condonar interés (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="condonar_interes_compensatorio_monto"
										value={formatAmountInput(
											formData.condonar_interes_compensatorio_monto,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Condonar mora (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="condonar_interes_moratorio_monto"
										value={formatAmountInput(
											formData.condonar_interes_moratorio_monto,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Condonar otros (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="condonar_otros_cargos_monto"
										value={formatAmountInput(
											formData.condonar_otros_cargos_monto,
										)}
										onChange={handleChange}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<label className="flex items-center gap-2 text-xs text-gray-300 bg-gray-900/30 border border-gray-700 rounded-xl px-3 py-3">
								<input
									type="checkbox"
									name="condonar_interes_compensatorio"
									checked={
										formData.condonar_interes_compensatorio
									}
									onChange={handleChange}
								/>
								Condonar 100% interés
							</label>
							<label className="flex items-center gap-2 text-xs text-gray-300 bg-gray-900/30 border border-gray-700 rounded-xl px-3 py-3">
								<input
									type="checkbox"
									name="condonar_interes_moratorio"
									checked={
										formData.condonar_interes_moratorio
									}
									onChange={handleChange}
								/>
								Condonar 100% mora
							</label>
							<label className="flex items-center gap-2 text-xs text-gray-300 bg-gray-900/30 border border-gray-700 rounded-xl px-3 py-3">
								<input
									type="checkbox"
									name="condonar_otros_cargos"
									checked={formData.condonar_otros_cargos}
									onChange={handleChange}
								/>
								Condonar 100% otros
							</label>
						</div>
					</Section>
				)}

				<Section
					title="Cronograma de pagos"
					description="Define la fecha de la primera cuota, la cuota inicial y el número de cuotas."
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Fecha 1ra cuota
							</label>
							<input
								type="date"
								name="fecha_primera_cuota"
								value={formData.fecha_primera_cuota}
								onChange={handleChange}
								required
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
							/>
						</div>
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								N° cuotas
							</label>
							<input
								type="number"
								name="numero_cuotas"
								value={formData.numero_cuotas}
								onChange={handleChange}
								required
								min={1}
								className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								Cuota inicial (S/)
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
									S/
								</span>
								<input
									type="text"
									inputMode="decimal"
									name="cuota_inicial"
									value={formatAmountInput(
										formData.cuota_inicial,
									)}
									onChange={handleChange}
									required
									className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="0.00"
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
								<div className="text-gray-400 text-xs uppercase tracking-wider">
									Pactado
								</div>
								<div className="mt-2 font-bold text-white">
									S/ {computed.montoPactado.toFixed(2)}
								</div>
							</div>
							<div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
								<div className="text-gray-400 text-xs uppercase tracking-wider">
									Cuota aprox.
								</div>
								<div className="mt-2 font-bold text-white">
									S/ {computed.cuotaMensual.toFixed(2)}
								</div>
							</div>
						</div>
					</div>
				</Section>

				<button
					type="submit"
					disabled={loading}
					className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
						loading
							? "bg-gray-700 cursor-not-allowed opacity-70"
							: "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 active:scale-[0.98]"
					}`}
				>
					{loading ? "Procesando..." : "Generar PDF"}
				</button>
			</form>

			{message && (
				<div
					className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-fade-in ${
						message.type === "error"
							? "bg-red-500/10 text-red-400 border border-red-500/20"
							: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
					}`}
				>
					<span
						className={`shrink-0 w-2 h-2 rounded-full ${message.type === "error" ? "bg-red-400" : "bg-emerald-400"}`}
					></span>
					{message.text}
				</div>
			)}
		</div>
	);
};

export default DocumentationForm;
