import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	montoATextoSoles,
	normalizeAmountInput,
	parseAmountNumber,
} from "../../utils/money";
import { FormHeader, MessageBanner, SubmitButton } from "./FormControls";
import {
	CreditSection,
	DebtorSection,
	DocumentSection,
	InformeSection,
	ScheduleSection,
} from "./DocumentationSections";

const getTodayIso = () => {
	const d = new Date();
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
};

const chooseApiBase = async () => {
	if (import.meta.env.DEV) {
		try {
			await axios.get("http://localhost:5000/health", { timeout: 2000 });
			return "http://localhost:5000";
		} catch (_e) {
			void _e;
		}
		try {
			await axios.get("http://localhost:5001/health", { timeout: 2000 });
			return "http://localhost:5001";
		} catch (_e) {
			void _e;
		}
	}
	return import.meta.env.VITE_API_URL || "http://localhost:5000";
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

const getAxiosErrorMessage = async (error) => {
	if (error.response) {
		let errorMsg =
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

		return errorMsg;
	}

	if (error.request) {
		return "No se recibió respuesta. Verifica que el backend esté corriendo en el puerto 5000.";
	}

	return error.message || "Error al conectar con el servidor.";
};

const MONEY_FIELDS = new Set([
	"deuda_total",
	"monto_pactado",
	"cuota_inicial",
	"saldo_capital",
	"interes_compensatorio",
	"interes_moratorio",
	"otros_cargos",
	"condonar_interes_compensatorio_monto",
	"condonar_interes_moratorio_monto",
	"condonar_otros_cargos_monto",
]);

const CHECKBOX_TO_MONTO = {
	condonar_interes_compensatorio: "condonar_interes_compensatorio_monto",
	condonar_interes_moratorio: "condonar_interes_moratorio_monto",
	condonar_otros_cargos: "condonar_otros_cargos_monto",
};

const Stepper = ({ steps, currentStep, onSelect }) => (
	<div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
		<div className="flex flex-wrap items-center gap-3">
			{steps.map((step, idx) => {
				const isActive = idx === currentStep;
				const isClickable = idx <= currentStep;
				return (
					<button
						key={step.key}
						type="button"
						onClick={() => (isClickable ? onSelect(idx) : null)}
						disabled={!isClickable}
						className={`flex items-center gap-2 rounded-full px-3 py-1.5 border text-sm transition-colors ${
							isActive
								? "bg-violet-600/20 border-violet-500 text-white"
								: isClickable
									? "bg-gray-900/40 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
									: "bg-gray-900/20 border-gray-800 text-gray-600 cursor-not-allowed"
						}`}
					>
						<span
							className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
								isActive
									? "bg-violet-600 text-white"
									: "bg-gray-800 text-gray-300"
							}`}
						>
							{idx + 1}
						</span>
						<span className="font-semibold">{step.label}</span>
					</button>
				);
			})}
		</div>
	</div>
);

const DocumentationForm = ({ docType }) => {
	const todayIso = useMemo(() => getTodayIso(), []);
	const [formData, setFormData] = useState(() => ({
		docType: docType || "compromiso",
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
		acta_transaccion: "",
		fecha_acta_transaccion: todayIso,
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
	}));
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);
	const [currentStep, setCurrentStep] = useState(0);

	const isInforme = formData.docType === "informe";
	const steps = isInforme
		? [
				{ key: "doc", label: "Documento" },
				{ key: "deudor", label: "Deudor" },
				{ key: "credito", label: "Crédito" },
				{ key: "informe", label: "Informe" },
				{ key: "cronograma", label: "Cronograma" },
			]
		: [
				{ key: "doc", label: "Documento" },
				{ key: "deudor", label: "Deudor" },
				{ key: "credito", label: "Crédito" },
				{ key: "cronograma", label: "Cronograma" },
			];
	const maxStep = steps.length - 1;

	useEffect(() => {
		setCurrentStep(0);
		setMessage(null);
	}, [formData.docType]);

	useEffect(() => {
		if (!docType) return;
		const normalized =
			docType === "informe" || docType === "compromiso"
				? docType
				: "compromiso";
		setFormData((prev) =>
			prev.docType === normalized
				? prev
				: { ...prev, docType: normalized },
		);
	}, [docType]);

	const computed = useMemo(() => {
		const saldoCapital = parseAmountNumber(formData.saldo_capital);
		const interesComp = parseAmountNumber(formData.interes_compensatorio);
		const interesMora = parseAmountNumber(formData.interes_moratorio);
		const otrosCargos = parseAmountNumber(formData.otros_cargos);

		const deudaTotal =
			formData.docType === "informe"
				? Math.max(
						0,
						saldoCapital + interesComp + interesMora + otrosCargos,
					)
				: parseAmountNumber(formData.deuda_total);
		const cuotaInicial = parseAmountNumber(formData.cuota_inicial);

		let montoPactado;
		if (formData.docType === "compromiso") {
			montoPactado = parseAmountNumber(formData.monto_pactado);
		} else {
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
			deudaTotalTexto: montoATextoSoles(deudaTotal),
			saldoCapital,
			interesCompensatorio: interesComp,
			interesMoratorio: interesMora,
			otrosCargos,
			montoPactado,
			montoCondonado,
			cuotaInicial,
			saldoFraccionado,
			cuotasCount,
			cuotaMensual,
		};
	}, [
		formData.condonar_interes_compensatorio,
		formData.condonar_interes_compensatorio_monto,
		formData.condonar_interes_moratorio,
		formData.condonar_interes_moratorio_monto,
		formData.condonar_otros_cargos,
		formData.condonar_otros_cargos_monto,
		formData.cuota_inicial,
		formData.deuda_total,
		formData.docType,
		formData.interes_compensatorio,
		formData.interes_moratorio,
		formData.monto_pactado,
		formData.numero_cuotas,
		formData.otros_cargos,
		formData.saldo_capital,
	]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;

		if (name === "docType") return;

		if (type === "checkbox") {
			const montoName = CHECKBOX_TO_MONTO[name];
			setFormData((prev) => ({
				...prev,
				[name]: checked,
				...(checked && montoName ? { [montoName]: "" } : {}),
			}));
			return;
		}

		const nextValue = MONEY_FIELDS.has(name)
			? normalizeAmountInput(value)
			: value;
		setFormData((prev) => ({ ...prev, [name]: nextValue }));
	};

	const validateStep = (stepIdx) => {
		const requiredInforme = [
			["fecha_emision", "numero_informe", "de", "asunto"],
			["apellidos", "nombres", "dni", "direction"],
			[
				"fecha_credito",
				"dias_atraso",
				"saldo_capital",
				"interes_compensatorio",
				"interes_moratorio",
				"otros_cargos",
			],
			[
				"fecha_reprogramacion",
				"acta_transaccion",
				"fecha_acta_transaccion",
			],
			["fecha_primera_cuota", "numero_cuotas", "cuota_inicial"],
		];
		const requiredCompromiso = [
			["fecha_emision"],
			["apellidos", "nombres", "dni", "direction"],
			["fecha_credito", "deuda_total", "monto_pactado"],
			["fecha_primera_cuota", "numero_cuotas", "cuota_inicial"],
		];

		const fields =
			(isInforme ? requiredInforme : requiredCompromiso)[stepIdx] || [];
		const missing = fields.filter((name) => {
			const value = formData[name];
			if (typeof value === "string") return value.trim() === "";
			return value === null || value === undefined;
		});

		if (missing.length) {
			setMessage({
				type: "error",
				text: "Completa los campos requeridos antes de continuar.",
			});
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage(null);

		try {
			const API_URL = await chooseApiBase();
			const nombre = `${formData.apellidos} ${formData.nombres}`
				.toUpperCase()
				.trim();

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
					formData.docType === "informe"
						? "Administración de créditos / Gerencia de recuperaciones"
						: undefined,
				de: formData.docType === "informe" ? formData.de : undefined,
				asunto:
					formData.docType === "informe"
						? formData.asunto
						: undefined,
				dias_atraso:
					formData.docType === "informe"
						? formData.dias_atraso
						: undefined,
				estado_deuda: undefined,
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
					{
						responseType: "blob",
					},
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
			const errorMsg = await getAxiosErrorMessage(error);
			setMessage({ type: "error", text: errorMsg });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<FormHeader
				title="Documentación"
				subtitle="Genera Compromiso de Pago o Informe de Gestión"
			/>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Stepper
					steps={steps}
					currentStep={currentStep}
					onSelect={(idx) => setCurrentStep(idx)}
				/>

				{currentStep === 0 ? (
					<DocumentSection
						formData={formData}
						onChange={handleChange}
					/>
				) : null}
				{currentStep === 1 ? (
					<DebtorSection
						formData={formData}
						onChange={handleChange}
					/>
				) : null}
				{currentStep === 2 ? (
					<CreditSection
						formData={formData}
						onChange={handleChange}
						computed={computed}
					/>
				) : null}
				{isInforme && currentStep === 3 ? (
					<InformeSection
						formData={formData}
						onChange={handleChange}
						computed={computed}
					/>
				) : null}
				{currentStep === maxStep ? (
					<ScheduleSection
						formData={formData}
						onChange={handleChange}
						computed={computed}
					/>
				) : null}

				<div className="flex items-center justify-between gap-4">
					<button
						type="button"
						onClick={() =>
							setCurrentStep((s) => Math.max(0, s - 1))
						}
						disabled={loading || currentStep === 0}
						className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border ${
							loading || currentStep === 0
								? "bg-gray-900/20 border-gray-800 text-gray-600 cursor-not-allowed"
								: "bg-gray-900/40 border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
						}`}
					>
						Anterior
					</button>

					{currentStep < maxStep ? (
						<button
							type="button"
							onClick={() => {
								setMessage(null);
								if (!validateStep(currentStep)) return;
								setCurrentStep((s) => Math.min(maxStep, s + 1));
							}}
							disabled={loading}
							className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
								loading
									? "bg-gray-700 cursor-not-allowed opacity-70"
									: "bg-linear-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 active:scale-[0.98]"
							}`}
						>
							Siguiente
						</button>
					) : (
						<div className="flex-1">
							<SubmitButton loading={loading} />
						</div>
					)}
				</div>
			</form>

			<MessageBanner message={message} />
		</div>
	);
};

export default DocumentationForm;
