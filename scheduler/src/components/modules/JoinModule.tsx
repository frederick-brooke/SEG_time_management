/**
 * @file JoinModule.tsx
 * @description A modal interface allowing users to join an existing module by entering
 * a 6-character alphanumeric PIN. Handles client-side validation, server action submission,
 * and loading/error states.
 */

"use client";

import { Button } from "@/components/ui/Button";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { joinModule } from "@/app/actions/module";
import { useUI } from "@/context/UIContext";
import { X } from "lucide-react";
import { LunarCard } from "../ui/LunarCard";

/**
 * Represents the core data of a module returned after successfully joining.
 */
interface ModuleData {
	id: string;
	[key: string]: any;
}

/**
 * Props for the JoinModule component.
 */
interface JoinModuleProps {
	onClose: () => void;
	onSuccess?: (module: ModuleData) => void;
}

/**
 * Renders the header of the modal.
 *
 * @param {{ onClose: () => void }} props - Component props.
 * @returns {JSX.Element} The modal header.
 */
function ModalHeader({ onClose }: { onClose: () => void }) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between mb-2">
				<h3 className="lunar-header">Join Module</h3>
				<Button
					onClick={onClose}
					className="lunar-close-button !-top-3 !-right-3"
				>
					<X size={20} />
				</Button>
			</div>
			<p className="lunar-form-subtitle">
				Enter the join PIN to add this module to your profile
			</p>
		</div>
	);
}

/**
 * Renders the PIN input field with its label and helper text.
 *
 * @param {{ pin: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }} props - Component props.
 * @returns {JSX.Element} The input block.
 */
function PinInputBlock({
	pin,
	onChange,
}: {
	pin: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className="grid gap-2">
			<label className="lunar-label">Enter Join PIN</label>
			<input
				type="text"
				value={pin}
				onChange={onChange}
				placeholder="AB12CD"
				maxLength={6}
				required
				className="lunar-input w-full p-4 rounded-xl text-center text-2xl font-mono font-black tracking-widest uppercase"
			/>
			<p className="text-[10px] text-white/30 text-center font-medium">
				6-character code (letters and numbers)
			</p>
		</div>
	);
}

/**
 * Renders the cancel and submit action buttons.
 *
 * @param {{ onClose: () => void; isPending: boolean; isValid: boolean }} props - Component props.
 * @returns {JSX.Element} The action buttons.
 */
function ActionButtons({
	onClose,
	isPending,
	isValid,
}: {
	onClose: () => void;
	isPending: boolean;
	isValid: boolean;
}) {
	return (
		<div className="flex gap-3 pt-4">
			<Button
				type="button"
				onClick={onClose}
				disabled={isPending}
				className="flex-1 px-6 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition disabled:opacity-50"
			>
				Cancel
			</Button>
			<Button
				type="submit"
				disabled={isPending || !isValid}
				className="flex-1 px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isPending ? "Joining..." : "Join"}
			</Button>
		</div>
	);
}

/**
 * Modal for joining an existing module using a join PIN.
 *
 * @param {JoinModuleProps} props - Modal control props.
 * @returns {JSX.Element} Join module modal.
 */
export default function JoinModule({ onClose, onSuccess }: JoinModuleProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [pin, setPin] = useState("");
	const [mounted, setMounted] = useState(false);
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		setIsModalOpen(true);
		return () => setIsModalOpen(false);
	}, [setIsModalOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (pin.trim().length !== 6)
			return setError("PIN must be 6 characters");

		startTransition(async () => {
			const result = await joinModule(pin);
			if (result.success && result.module) {
				if (onSuccess) onSuccess(result.module);
				onClose();
			} else {
				setError(result.error || "Failed to join module");
			}
		});
	};

	const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPin(e.target.value.toUpperCase().slice(0, 6));
	};

	const modalContent =
		mounted &&
		createPortal(
			<div
				className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
				style={{ isolation: "initial" }}
				onClick={(e) => {
					if (e.target === e.currentTarget) onClose();
				}}
			>
				<LunarCard
					className="relative p-8 w-full max-w-lg"
					onClick={(e) => e.stopPropagation()}
				>
					<ModalHeader onClose={onClose} />
					<form onSubmit={handleSubmit} className="grid gap-2 py-2">
						<PinInputBlock pin={pin} onChange={handlePinChange} />
						{error && (
							<div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/30">
								{error}
							</div>
						)}
						<ActionButtons
							onClose={onClose}
							isPending={isPending}
							isValid={pin.length === 6}
						/>
					</form>
				</LunarCard>
			</div>,
			document.body,
		);

	return modalContent;
}
