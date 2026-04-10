/**
 * @file CreateModule.tsx
 * @description A modal component that allows users (typically instructors or administrators)
 * to create a new module. Handles form submission, communicates with the server action,
 * and displays a success screen with a copyable join PIN.
 */
"use client";

import { Button } from "@/components/ui/Button";
import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { createModule } from "@/app/actions/module";
import { X } from "lucide-react";
import { LunarCard } from "../ui/LunarCard";

/**
 * Represents the core data of a created module.
 */
interface ModuleData {
	id: string;
	name: string;
	[key: string]: any;
}

/**
 * Props for the CreateModule component.
 */
interface CreateModuleProps {
	onClose: () => void;
	onSuccess?: (module: ModuleData, joinPin: string) => void;
}

/**
 * Props for the internal CreateForm sub-component.
 */
interface CreateFormProps {
	onSubmit: (formData: FormData) => void;
	onClose: () => void;
	isPending: boolean;
	error: string | null;
}

/**
 * Props for the internal SuccessScreen sub-component.
 */
interface SuccessScreenProps {
	joinPin: string;
	onClose: () => void;
	copyPin: () => void;
}

/**
 * Renders the success state displaying the generated Join PIN.
 *
 * @param {SuccessScreenProps} props - Component props.
 * @returns {JSX.Element} The success screen UI.
 */
function SuccessScreen({ joinPin, onClose, copyPin }: SuccessScreenProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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
					className="relative p-8 w-full max-w-lg text-center"
					onClick={(e) => e.stopPropagation()}
				>
					<div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
						<span className="text-3xl">✅</span>
					</div>
					<h3 className="lunar-header mb-2">Module Created!</h3>
					<p className="lunar-value mb-6">
						Share the PIN with participants to join
					</p>

					<div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
						<p className="lunar-label mb-3">Join PIN</p>
						<div className="flex items-center justify-center gap-3">
							<code className="text-3xl font-mono font-black text-blue-400 tracking-wider drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
								{joinPin}
							</code>
							<Button
								onClick={copyPin}
								className="px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition text-xs disabled:opacity-50"
							>
								Copy
							</Button>
						</div>
					</div>

					<Button
						onClick={onClose}
						className="px-6 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition w-full"
					>
						Done
					</Button>
				</LunarCard>
			</div>,
			document.body,
		);

	return modalContent;
}

/**
 * Renders the form for creating a new module.
 *
 * @param {CreateFormProps} props - Component props.
 * @returns {JSX.Element} The creation form UI.
 */
function CreateForm({ onSubmit, onClose, isPending, error }: CreateFormProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

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
					<Button
						onClick={onClose}
						className="lunar-close-button !-top-3"
					>
						<X size={20} />
					</Button>

					<div className="mb-8">
						<h3 className="lunar-header">Create New Module</h3>
						<p className="lunar-form-subtitle">
							Set up a new module and share with team members
						</p>
					</div>

					<form action={onSubmit} className="grid gap-2 py-2">
						<div className="grid gap-2">
							<label className="lunar-label">
								Module Name{" "}
								<span className="text-red-400">*</span>
							</label>
							<input
								type="text"
								name="name"
								required
								maxLength={100}
								placeholder="e.g., Computer Science 101"
								className="lunar-input w-full p-3 rounded-xl"
							/>
						</div>

						<div className="grid gap-2">
							<label className="lunar-label">Description</label>
							<textarea
								name="description"
								rows={3}
								maxLength={500}
								placeholder="Optional description..."
								className="lunar-input w-full p-3 rounded-xl resize-none"
							/>
						</div>

						<div className="grid gap-2">
							<label className="lunar-label">Max Members</label>
							<input
								type="number"
								name="maxMembers"
								min={2}
								max={100}
								defaultValue={50}
								className="lunar-input w-full p-3 rounded-xl"
							/>
							<p className="text-[10px] text-white/30 font-medium">
								Between 2 and 100 members
							</p>
						</div>

						{error && (
							<div className="p-4 text-sm text-red-400 bg-red-500/10 rounded-xl border border-red-500/30">
								{error}
							</div>
						)}

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
								disabled={isPending}
								className="flex-1 px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isPending ? "Creating..." : "Create"}
							</Button>
						</div>
					</form>
				</LunarCard>
			</div>,
			document.body,
		);

	return modalContent;
}

/**
 * Modal for creating a new module with custom settings.
 * Routes between the creation form and the success screen.
 *
 * @param {CreateModuleProps} props - Modal control props.
 * @returns {JSX.Element} Create module modal or success screen.
 */
export default function CreateModule({
	onClose,
	onSuccess,
}: CreateModuleProps) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [createdModule, setCreatedModule] = useState<ModuleData | null>(null);
	const [joinPin, setJoinPin] = useState<string | null>(null);

	const handleSubmit = async (formData: FormData) => {
		setError(null);
		startTransition(async () => {
			const result = await createModule(formData);
			if (result.success && result.module && result.joinPin) {
				setCreatedModule(result.module);
				setJoinPin(result.joinPin);
				if (onSuccess) onSuccess(result.module, result.joinPin);
			} else {
				setError(result.error || "Failed to create module");
			}
		});
	};

	const copyPin = () => {
		if (joinPin) navigator.clipboard.writeText(joinPin);
	};

	if (createdModule && joinPin) {
		return (
			<SuccessScreen
				joinPin={joinPin}
				onClose={onClose}
				copyPin={copyPin}
			/>
		);
	}

	return (
		<CreateForm
			onSubmit={handleSubmit}
			onClose={onClose}
			isPending={isPending}
			error={error}
		/>
	);
}
