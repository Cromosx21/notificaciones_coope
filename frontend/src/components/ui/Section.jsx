import React from "react";

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

export default Section;
