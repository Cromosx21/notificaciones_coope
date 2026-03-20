import React from "react";
import { formatAmountInput } from "../../utils/money";

export const labelClassName =
	"block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider group-focus-within:text-violet-400 transition-colors";
export const inputClassName =
	"w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 text-white placeholder-gray-600 transition-all duration-200";

const disabledClassName = "opacity-50 cursor-not-allowed";

export const FormHeader = ({ title, subtitle }) => (
	<div className="mb-8 text-center">
		<h2 className="text-2xl font-bold text-white tracking-tight">
			{title}
		</h2>
		{subtitle ? (
			<p className="text-gray-400 text-sm mt-2">{subtitle}</p>
		) : null}
	</div>
);

export const TextInput = ({
	label,
	name,
	value,
	onChange,
	placeholder,
	required,
	disabled,
	type = "text",
	className,
	...inputProps
}) => (
	<div className="group">
		<label className={labelClassName}>{label}</label>
		<input
			type={type}
			name={name}
			value={value}
			onChange={onChange}
			required={required}
			disabled={disabled}
			placeholder={placeholder}
			{...inputProps}
			className={`${inputClassName} ${disabled ? disabledClassName : ""} ${className || ""}`}
		/>
	</div>
);

export const DateInput = (props) => <TextInput {...props} type="date" />;

export const NumberInput = (props) => <TextInput {...props} type="number" />;

export const SelectInput = ({
	label,
	name,
	value,
	onChange,
	options,
	disabled,
}) => (
	<div className="group">
		<label className={labelClassName}>{label}</label>
		<select
			name={name}
			value={value}
			onChange={onChange}
			disabled={disabled}
			className={`${inputClassName} px-4 ${disabled ? disabledClassName : ""}`}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	</div>
);

export const MoneyInput = ({
	label,
	name,
	value,
	onChange,
	placeholder,
	required,
	disabled,
}) => (
	<div className="group">
		<label className={labelClassName}>{label}</label>
		<div className="relative">
			<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
				S/
			</span>
			<input
				type="text"
				inputMode="decimal"
				name={name}
				value={formatAmountInput(value)}
				onChange={onChange}
				required={required}
				disabled={disabled}
				placeholder={placeholder}
				className={`${inputClassName} pl-10 pr-4 ${disabled ? disabledClassName : ""}`}
			/>
		</div>
	</div>
);

export const SummaryCard = ({ title, value, className }) => (
	<div
		className={`bg-gray-900/30 border border-gray-700 rounded-xl p-4 ${className || ""}`}
	>
		<div className="text-gray-400 text-xs uppercase tracking-wider">
			{title}
		</div>
		<div className="mt-2 text-white">{value}</div>
	</div>
);

export const SummaryAmountCard = ({ title, amount }) => (
	<SummaryCard
		title={title}
		value={<span className="font-bold text-white">S/ {amount}</span>}
	/>
);

export const CheckboxAmountCard = ({
	title,
	checkboxName,
	checked,
	amountName,
	amountValue,
	onChange,
	placeholder,
}) => (
	<div className="bg-gray-900/30 border border-gray-700 rounded-xl p-4">
		<div className="flex items-center justify-between">
			<div className="text-gray-300 text-sm font-semibold">{title}</div>
			<input
				type="checkbox"
				name={checkboxName}
				checked={checked}
				onChange={onChange}
				className="h-4 w-4 accent-violet-500"
			/>
		</div>
		<input
			type="text"
			inputMode="decimal"
			name={amountName}
			value={formatAmountInput(amountValue)}
			onChange={onChange}
			disabled={!checked}
			className={`${inputClassName} mt-3 ${!checked ? disabledClassName : ""}`}
			placeholder={placeholder}
		/>
	</div>
);

export const SubmitButton = ({ loading }) => (
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
);

export const MessageBanner = ({ message }) => {
	if (!message) return null;

	return (
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
	);
};
