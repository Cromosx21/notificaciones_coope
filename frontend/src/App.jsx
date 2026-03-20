import React from "react";
import GeneratorForm from "./components/GeneratorForm";

function App() {
	return (
		<div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#1a1c2e] to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
			{/* Decorative background elements */}
			<div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
			<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

			<div className="w-full max-w-5xl space-y-8 relative z-10">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-600 mb-6 shadow-lg shadow-violet-500/20">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-8 w-8 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400 tracking-tight">
						Notificaciones
					</h1>
					<p className="mt-3 text-base text-gray-400 max-w-xs mx-auto">
						Generación automatizada de documentos oficiales
					</p>
				</div>
				<GeneratorForm />

				<p className="text-center text-xs text-gray-600 mt-8">
					&copy; {new Date().getFullYear()} Sistema de Gestión
				</p>
			</div>
		</div>
	);
}

export default App;
