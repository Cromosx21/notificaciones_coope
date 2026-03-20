import React from "react";
import Section from "../ui/Section";
import {
	CheckboxAmountCard,
	DateInput,
	MoneyInput,
	NumberInput,
	SummaryAmountCard,
	SummaryCard,
	TextInput,
} from "./FormControls";

export const DocumentSection = ({ formData, onChange }) => (
	<Section
		title="Documento"
		description="Datos del encabezado del documento."
	>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<DateInput
				label="Fecha Emisión"
				name="fecha_emision"
				value={formData.fecha_emision}
				onChange={onChange}
				required
			/>
			<TextInput
				label="Código (opcional)"
				name="codigo"
				value={formData.codigo}
				onChange={onChange}
				placeholder="Ej. 001-2026"
			/>
		</div>

		{formData.docType === "informe" ? (
			<>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<TextInput
						label="Número Informe"
						name="numero_informe"
						value={formData.numero_informe}
						onChange={onChange}
						required
						placeholder="007"
					/>
					<SummaryCard
						title="A"
						value="Administración de créditos / Gerencia de recuperaciones"
						className="flex flex-col justify-center"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<TextInput
						label="De"
						name="de"
						value={formData.de}
						onChange={onChange}
						required
						placeholder="Gestor de Recuperaciones"
					/>
					<TextInput
						label="Asunto"
						name="asunto"
						value={formData.asunto}
						onChange={onChange}
						required
						placeholder="Solicitud de Condonación de Mora"
					/>
				</div>
			</>
		) : null}
	</Section>
);

export const DebtorSection = ({ formData, onChange }) => (
	<Section title="Deudor" description="Datos de identificación del socio.">
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<TextInput
				label="Apellidos"
				name="apellidos"
				value={formData.apellidos}
				onChange={onChange}
				required
				placeholder="Ej. PÉREZ GÓMEZ"
			/>
			<TextInput
				label="Nombres"
				name="nombres"
				value={formData.nombres}
				onChange={onChange}
				required
				placeholder="Ej. JUAN CARLOS"
			/>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<TextInput
				label="DNI"
				name="dni"
				value={formData.dni}
				onChange={onChange}
				required
				placeholder="Ej. 12345678"
			/>
			<TextInput
				label="Domicilio"
				name="direction"
				value={formData.direction}
				onChange={onChange}
				required
				placeholder="Ej. Av. Los Próceres 123 - Ayacucho"
			/>
		</div>
	</Section>
);

export const CreditSection = ({ formData, onChange, computed }) => (
	<Section
		title="Crédito"
		description="Constitución del crédito y datos base."
	>
		{formData.docType === "informe" ? (
			<>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<DateInput
						label="Fecha de Desembolso"
						name="fecha_credito"
						value={formData.fecha_credito}
						onChange={onChange}
						required
					/>
					<TextInput
						label="Días de atraso"
						name="dias_atraso"
						value={formData.dias_atraso}
						onChange={onChange}
						required
						placeholder="1000"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<MoneyInput
						label="Saldo Capital (S/)"
						name="saldo_capital"
						value={formData.saldo_capital}
						onChange={onChange}
						required
						placeholder="0.00"
					/>
					<MoneyInput
						label="Interés Compensatorio (S/)"
						name="interes_compensatorio"
						value={formData.interes_compensatorio}
						onChange={onChange}
						required
						placeholder="0.00"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<MoneyInput
						label="Interés Moratorio (Mora) (S/)"
						name="interes_moratorio"
						value={formData.interes_moratorio}
						onChange={onChange}
						required
						placeholder="0.00"
					/>
					<MoneyInput
						label="Otros cargos (S/)"
						name="otros_cargos"
						value={formData.otros_cargos}
						onChange={onChange}
						required
						placeholder="0.00"
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<SummaryAmountCard
						title="Deuda total"
						amount={computed.deudaTotal.toFixed(2)}
					/>
					<div className="group" />
				</div>
			</>
		) : (
			<>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<DateInput
						label="Fecha de Desembolso"
						name="fecha_credito"
						value={formData.fecha_credito}
						onChange={onChange}
						required
					/>
					<div className="group" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<MoneyInput
						label="Deuda Total (S/)"
						name="deuda_total"
						value={formData.deuda_total}
						onChange={onChange}
						required
						placeholder="0.00"
					/>
					<SummaryCard
						title="Deuda total (en texto)"
						value={computed.deudaTotalTexto}
					/>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					<MoneyInput
						label="Monto pactado (S/)"
						name="monto_pactado"
						value={formData.monto_pactado}
						onChange={onChange}
						required
						placeholder="0.00"
					/>
					<div className="group" />
				</div>
			</>
		)}
	</Section>
);

export const ScheduleSection = ({ formData, onChange, computed }) => (
	<Section
		title="Cronograma"
		description="Define cuota inicial, número de cuotas y la primera fecha de vencimiento."
	>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<DateInput
				label="Fecha primera cuota"
				name="fecha_primera_cuota"
				value={formData.fecha_primera_cuota}
				onChange={onChange}
				required
			/>
			<NumberInput
				label="Número de cuotas"
				name="numero_cuotas"
				value={formData.numero_cuotas}
				onChange={onChange}
				required
				min="1"
				max="99"
			/>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<MoneyInput
				label="Cuota inicial (S/)"
				name="cuota_inicial"
				value={formData.cuota_inicial}
				onChange={onChange}
				required
				placeholder="0.00"
			/>

			<div className="grid grid-cols-2 gap-3">
				<SummaryAmountCard
					title="Pactado"
					amount={computed.montoPactado.toFixed(2)}
				/>
				<SummaryAmountCard
					title="Condonado"
					amount={computed.montoCondonado.toFixed(2)}
				/>
			</div>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
			<SummaryAmountCard
				title="Saldo fraccionado"
				amount={computed.saldoFraccionado.toFixed(2)}
			/>
			<SummaryAmountCard
				title="Cuota mensual"
				amount={computed.cuotaMensual.toFixed(2)}
			/>
			<SummaryCard title="N° cuotas" value={computed.cuotasCount} />
		</div>
	</Section>
);

export const InformeSection = ({ formData, onChange, computed }) => (
	<Section
		title="Informe"
		description="Reprogramación, condonación y acta de transacción."
	>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<DateInput
				label="Fecha de Reprogramación"
				name="fecha_reprogramacion"
				value={formData.fecha_reprogramacion}
				onChange={onChange}
				required
			/>
			<div className="group" />
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<SummaryAmountCard
				title="Saldo Capital"
				amount={computed.saldoCapital.toFixed(2)}
			/>
			<SummaryAmountCard
				title="Interés compensatorio"
				amount={computed.interesCompensatorio.toFixed(2)}
			/>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<SummaryAmountCard
				title="Interés moratorio (mora)"
				amount={computed.interesMoratorio.toFixed(2)}
			/>
			<SummaryAmountCard
				title="Otros cargos"
				amount={computed.otrosCargos.toFixed(2)}
			/>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
			<CheckboxAmountCard
				title="Condonar interés compensatorio"
				checkboxName="condonar_interes_compensatorio"
				checked={formData.condonar_interes_compensatorio}
				amountName="condonar_interes_compensatorio_monto"
				amountValue={formData.condonar_interes_compensatorio_monto}
				onChange={onChange}
				placeholder="Monto a condonar (opcional)"
			/>
			<CheckboxAmountCard
				title="Condonar interés moratorio"
				checkboxName="condonar_interes_moratorio"
				checked={formData.condonar_interes_moratorio}
				amountName="condonar_interes_moratorio_monto"
				amountValue={formData.condonar_interes_moratorio_monto}
				onChange={onChange}
				placeholder="Monto a condonar (opcional)"
			/>
			<CheckboxAmountCard
				title="Condonar otros cargos"
				checkboxName="condonar_otros_cargos"
				checked={formData.condonar_otros_cargos}
				amountName="condonar_otros_cargos_monto"
				amountValue={formData.condonar_otros_cargos_monto}
				onChange={onChange}
				placeholder="Monto a condonar (opcional)"
			/>
		</div>

		<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			<TextInput
				label="Acta de transacción (N°)"
				name="acta_transaccion"
				value={formData.acta_transaccion}
				onChange={onChange}
				required
				placeholder="000-2026"
			/>
			<DateInput
				label="Fecha acta de transacción"
				name="fecha_acta_transaccion"
				value={formData.fecha_acta_transaccion}
				onChange={onChange}
				required
			/>
		</div>
	</Section>
);
