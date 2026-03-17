import React, { useState } from "react";
import axios from "axios";

const GeneratorForm = () => {
	const initialFormData = {
		templateId: "1",
		nombres: "",
		apellidos: "",
		dni: "",
		direction: "",
		monto_total: "",
		plazo_horas: "",
		interes: "",
		mora: "",
		celular: "",
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

	const resetForm = () => {
		setFormData({
			...initialFormData,
			templateId: formData.templateId,
		});
		setMessage(null);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;

		if (name === "templateId") {
			setFormData({
				...initialFormData,
				templateId: value,
			});
			setMessage(null);
			return;
		}

		if (name === "monto_total" || name === "interes" || name === "mora") {
			setFormData({
				...formData,
				[name]: normalizeAmountInput(value),
			});
			return;
		}

		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage(null);

		try {
			const API_URL = await chooseApiBase();

			const payload = {
				templateId: formData.templateId,
				nombre: `${formData.apellidos} ${formData.nombres}`.toUpperCase(),
				dni: formData.dni,
				direction: formData.direction.toUpperCase(),
				monto_total: parseAmountNumber(
					formData.monto_total,
				).toLocaleString("en-US", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}),
				plazo_horas: formData.plazo_horas,
				interes:
					formData.templateId === "3"
						? parseAmountNumber(formData.interes).toLocaleString(
								"en-US",
								{
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								},
							)
						: undefined,
				mora:
					formData.templateId === "3"
						? parseAmountNumber(formData.mora).toLocaleString(
								"en-US",
								{
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								},
							)
						: undefined,
			};

			let response;
			try {
				response = await axios.post(
					`${API_URL}/generate-pdf`,
					payload,
					{
						responseType: "blob",
					},
				);
			} catch (err) {
				if (API_URL === "http://localhost:5000" && err.request) {
					response = await axios.post(
						`http://localhost:5001/generate-pdf`,
						payload,
						{ responseType: "blob" },
					);
				} else {
					throw err;
				}
			}

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			let filenameFromHeader;
			const cd =
				response.headers && response.headers["content-disposition"];
			if (cd) {
				const matchStar = /filename\*=UTF-8''([^;]+)/i.exec(cd);
				const matchBasic = /filename=\"?([^\";]+)\"?/i.exec(cd);
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
			if (!filenameFromHeader) {
				const labels = {
					1: "Carta N° 001",
					2: "Carta N° 002",
					3: "Carta N° 003",
					4: "Carta N° 004",
				};
				const label = labels[formData.templateId] || "Carta N° 001";
				filenameFromHeader = `${label} - ${formData.apellidos} ${formData.nombres}.pdf`;
			}
			link.setAttribute("download", filenameFromHeader);
			document.body.appendChild(link);
			link.click();
			link.remove();

			setMessage({
				type: "success",
				text: "PDF generado y descargado con éxito.",
			});

			resetForm();
		} catch (error) {
			console.error("Error:", error);
			let errorMsg = "Error al conectar con el servidor.";

			if (error.response) {
				errorMsg =
					error.response.data instanceof Blob
						? "Error al generar el PDF (Revisa la consola del servidor)"
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
		<div className="w-full max-w-lg mx-auto p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
			<div className="mb-8 text-center">
				<h2 className="text-2xl font-bold text-white tracking-tight">
					Generar Documento
				</h2>
				<p className="text-gray-400 text-sm mt-2">
					Ingresa los datos para crear la notificación oficial
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-5">
					<div className="group">
						<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
							Tipo de Notificación
						</label>
						<select
							name="templateId"
							value={formData.templateId}
							onChange={handleChange}
							className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white transition-all duration-200"
						>
							<option value="1">
								Carta N° 001 - Estado de socio
							</option>
							<option value="2">
								Carta N° 002 - Liquidación de costos
							</option>
							<option value="3">
								Carta N° 003 - Oportunidad de Saneamiento
							</option>
							<option value="4">
								Carta N° 004 - Auto Cierre Procesal
							</option>
						</select>
					</div>

					<div className="grid grid-cols-2 gap-5">
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

					<div className="grid grid-cols-2 gap-5">
						<div className="group">
							<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
								DNI / RUC
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
						{formData.templateId !== "3" && (
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Plazo (Horas)
								</label>
								<input
									type="number"
									name="plazo_horas"
									value={formData.plazo_horas}
									onChange={handleChange}
									required
									className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
									placeholder="Ej. 24, 48"
								/>
							</div>
						)}
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
								name="monto_total"
								value={formatAmountInput(formData.monto_total)}
								onChange={handleChange}
								required
								className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder="0.00"
							/>
						</div>
					</div>

					{formData.templateId === "3" && (
						<div className="grid grid-cols-2 gap-5">
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Interés a condonar (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="interes"
										value={formatAmountInput(
											formData.interes,
										)}
										onChange={handleChange}
										required={formData.templateId === "3"}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
							<div className="group">
								<label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors">
									Mora a condonar (S/)
								</label>
								<div className="relative">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
										S/
									</span>
									<input
										type="text"
										inputMode="decimal"
										name="mora"
										value={formatAmountInput(formData.mora)}
										onChange={handleChange}
										required={formData.templateId === "3"}
										className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
										placeholder="0.00"
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				<button
					type="submit"
					disabled={loading}
					className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
						loading
							? "bg-gray-700 cursor-not-allowed opacity-70"
							: "bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 active:scale-[0.98]"
					}`}
				>
					{loading ? (
						<span className="flex items-center justify-center gap-2">
							<svg
								className="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Procesando...
						</span>
					) : (
						"Generar PDF"
					)}
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

export default GeneratorForm;
