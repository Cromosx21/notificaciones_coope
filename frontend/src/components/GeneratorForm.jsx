import React, { useState } from "react";
import NotificationsForm from "./NotificationsForm";
import DocumentationForm from "./DocumentationForm";

const GeneratorForm = () => {
	const [activeTab, setActiveTab] = useState("notificaciones");
	const [docType, setDocType] = useState("compromiso");

	return (
		<div className="w-full max-w-4xl mx-auto p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
			<div className="flex items-center justify-center gap-3 mb-8">
				<button
					type="button"
					onClick={() => setActiveTab("notificaciones")}
					className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
						activeTab === "notificaciones"
							? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
							: "bg-gray-900/40 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
					}`}
				>
					Notificaciones
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("documentacion")}
					className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
						activeTab === "documentacion"
							? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
							: "bg-gray-900/40 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
					}`}
				>
					Documentación
				</button>
			</div>

			{activeTab === "documentacion" ? (
				<div className="mb-8">
					<div className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
						Tipo de documento
					</div>
					<div className="flex items-center justify-center gap-3">
						<button
							type="button"
							onClick={() => setDocType("compromiso")}
							className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
								docType === "compromiso"
									? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
									: "bg-gray-900/40 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
							}`}
						>
							Compromiso de Pago
						</button>
						<button
							type="button"
							onClick={() => setDocType("informe")}
							className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
								docType === "informe"
									? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20"
									: "bg-gray-900/40 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600"
							}`}
						>
							Informe de Gestión
						</button>
					</div>
				</div>
			) : null}

			{activeTab === "notificaciones" ? (
				<NotificationsForm />
			) : (
				<DocumentationForm
					docType={docType}
					onDocTypeChange={setDocType}
				/>
			)}
		</div>
	);
};

export default GeneratorForm;
