import React, { useState } from "react";
import axios from "axios";

const GeneratorForm = () => {
	const [formData, setFormData] = useState({
		nombre: "",
		dni: "",
		direction: "",
		monto_total: "",
		plazo_horas: "",
	});
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage(null);

		try {
			const response = await axios.post(
				"https://notificaciones-coope-hluh.vercel.app/generate-pdf",
				formData,
				{
					responseType: "blob",
				},
			);

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", `Notificacion_${formData.dni}.pdf`);
			document.body.appendChild(link);
			link.click();
			link.remove();

			setMessage({
				type: "success",
				text: "PDF generado y descargado con éxito.",
			});
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
						// No es JSON
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
							Nombre Completo
						</label>
						<input
							type="text"
							name="nombre"
							value={formData.nombre}
							onChange={handleChange}
							required
							className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
							placeholder="Ej. Juan Pérez"
						/>
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
								type="number"
								name="monto_total"
								value={formData.monto_total}
								onChange={handleChange}
								required
								className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200"
								placeholder="0.00"
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 ${
						loading
							? "bg-gray-700 cursor-not-allowed opacity-70"
							: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 active:scale-[0.98]"
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
						className={`flex-shrink-0 w-2 h-2 rounded-full ${message.type === "error" ? "bg-red-400" : "bg-emerald-400"}`}
					></span>
					{message.text}
				</div>
			)}
		</div>
	);
};

export default GeneratorForm;
