/**
 * @file ModuleSettingsModal.tsx
 * @description A modal interface allowing module owners to update core settings
 * such as the module's name, description, and maximum member capacity.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { X, Settings } from "lucide-react";
import { updateModuleSettings } from "@/app/actions/module";

/**
 * Represents the core data of a module required for settings configuration.
 */
interface ModuleSettingsData {
	id: string;
	name: string;
	description: string | null;
	maxMembers: number;
	memberCount: number;
}

/**
 * Props for the ModuleSettingsModal component.
 */
interface ModuleSettingsModalProps {
	module: ModuleSettingsData;
	onClose: () => void;
	onSuccess: () => void;
}

/**
 * State structure for the module settings form.
 */
interface SettingsFormState {
	name: string;
	description: string;
	maxMembers: number;
}

/**
 * Renders the header of the module settings modal.
 *
 * @param {{ onClose: () => void }} props - Component props.
 * @returns {JSX.Element} The modal header UI.
 */
function ModalHeader({ onClose }: { onClose: () => void }) {
	return (
		<div className="flex items-center justify-between mb-6">
			<h2 className="lunar-header flex items-center gap-2">
				<Settings size={18} className="text-white/40" /> Module Settings
			</h2>
			<Button
				onClick={onClose}
				className="text-white/30 hover:text-white transition-colors"
			>
				<X size={24} />
			</Button>
		</div>
	);
}

/**
 * Renders the input fields for the settings form.
 *
 * @param {{ formData: SettingsFormState; currentMemberCount: number; onChange: (updates: Partial<SettingsFormState>) => void }} props - Component props.
 * @returns {JSX.Element} The form fields.
 */
function SettingsFormFields({
	formData,
	currentMemberCount,
	onChange,
}: {
	formData: SettingsFormState;
	currentMemberCount: number;
	onChange: (updates: Partial<SettingsFormState>) => void;
}) {
	return (
		<>
			<div>
				<label htmlFor="module-name" className="lunar-label">
					Module Name
				</label>
				<input
					id="module-name"
					type="text"
					required
					value={formData.name}
					onChange={(e) => onChange({ name: e.target.value })}
					className="lunar-input w-full p-3 rounded-xl mt-1"
				/>
			</div>

			<div>
				<label htmlFor="module-desc" className="lunar-label">
					Description
				</label>
				<textarea
					id="module-desc"
					rows={3}
					value={formData.description}
					onChange={(e) => onChange({ description: e.target.value })}
					className="lunar-input w-full p-3 rounded-xl mt-1 resize-none"
				/>
			</div>

			<div>
				<label htmlFor="module-max" className="lunar-label">
					Max Members
				</label>
				<input
					id="module-max"
					type="number"
					min={currentMemberCount}
					max={100}
					required
					value={formData.maxMembers}
					onChange={(e) =>
						onChange({
							maxMembers:
								parseInt(e.target.value) || currentMemberCount,
						})
					}
					className="lunar-input w-full p-3 rounded-xl mt-1"
				/>
				<p className="text-[10px] text-white/30 mt-1 font-medium">
					Currently using {currentMemberCount} of{" "}
					{formData.maxMembers} spots.
				</p>
			</div>
		</>
	);
}

/**
 * Renders the action buttons and potential error messages for the form.
 *
 * @param {{ onClose: () => void; isSubmitting: boolean; error: string | null }} props - Component props.
 * @returns {JSX.Element} The action buttons and error display.
 */
function FormActionButtons({
	onClose,
	isSubmitting,
	error,
}: {
	onClose: () => void;
	isSubmitting: boolean;
	error: string | null;
}) {
	return (
		<>
			{error && (
				<div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">
					{error}
				</div>
			)}
			<div className="flex gap-3 pt-4">
				<Button
					type="button"
					onClick={onClose}
					disabled={isSubmitting}
					className="flex-1 lunar-button-ghost disabled:opacity-50"
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
					className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Saving..." : "Save Settings"}
				</Button>
			</div>
		</>
	);
}

/**
 * Modal for updating module name, description, and max members — accessible to owners only.
 *
 * @param {ModuleSettingsModalProps} props - Module data and callbacks.
 * @returns {JSX.Element} Module settings modal.
 */
export default function ModuleSettingsModal({
	module,
	onClose,
	onSuccess,
}: ModuleSettingsModalProps) {
	const [formData, setFormData] = useState<SettingsFormState>({
		name: module.name,
		description: module.description || "",
		maxMembers: module.maxMembers,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setIsModalOpen(true);
		return () => setIsModalOpen(false);
	}, [setIsModalOpen]);

	const handleChange = (updates: Partial<SettingsFormState>) => {
		setFormData((prev) => ({ ...prev, ...updates }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		const result = await updateModuleSettings(module.id, {
			name: formData.name,
			description: formData.description,
			maxMembers: Number(formData.maxMembers),
		});

		setIsSubmitting(false);

		if (result.success) {
			onSuccess();
			onClose();
		} else {
			setError(
				"error" in result
					? (result.error as string)
					: "Failed to update settings",
			);
		}
	};

	return (
		<div className="lunar-overlay z-[100]" onClick={onClose}>
			<div
				className="lunar-card p-6 max-w-md w-full"
				onClick={(e) => e.stopPropagation()}
			>
				<ModalHeader onClose={onClose} />

				<form onSubmit={handleSubmit} className="space-y-4">
					<SettingsFormFields
						formData={formData}
						currentMemberCount={module.memberCount}
						onChange={handleChange}
					/>
					<FormActionButtons
						onClose={onClose}
						isSubmitting={isSubmitting}
						error={error}
					/>
				</form>
			</div>
		</div>
	);
}
