"use client";

/**
 * SaveLocationModal — inline modal for saving a resolved address
 * as a named saved location with a HOME, WORK, or FAVOURITE type.
 */

import { useState, useEffect } from "react";
import { useUI } from "@/context/UIContext";
import { Button } from "../ui/Button";

const TYPE_ICONS: Record<string, string> = {
	HOME: "🏠",
	WORK: "🏢",
	FAVOURITE: "⭐",
};

const TYPE_LABELS: Record<string, string> = {
	HOME: "Home",
	WORK: "Work",
	FAVOURITE: "Favourite",
};

export interface SaveLocationModalProps {
	address: string;
	lat: number;
	lng: number;
	onSave: (
		label: string,
		type: "HOME" | "WORK" | "FAVOURITE",
	) => Promise<void>;
	onClose: () => void;
}

/**
 * Renders a small popover form below the location input. The label
 * defaults to the first part of the address. Calls onSave then onClose
 * on successful submission.
 */
export default function SaveLocationModal({
	address,
	lat,
	lng,
	onSave,
	onClose,
}: SaveLocationModalProps) {
	const [label, setLabel] = useState(address.split(",")[0] || "");
	const [type, setType] = useState<"HOME" | "WORK" | "FAVOURITE">(
		"FAVOURITE",
	);
	const [saving, setSaving] = useState(false);
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setIsModalOpen(true);
		return () => setIsModalOpen(false);
	}, [setIsModalOpen]);

	const handleSave = async () => {
		if (!label.trim()) return;
		setSaving(true);
		try {
			await onSave(label.trim(), type);
			onClose();
		} catch (err) {
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="absolute z-[200] left-0 right-0 mt-1 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<p className="text-xs font-bold text-white/30 uppercase tracking-wider">
					Save Location
				</p>
				<Button
					type="button"
					onClick={onClose}
					className="text-white/30 hover:text-white/70 text-lg leading-none transition-colors"
				>
					✕
				</Button>
			</div>

			<p className="text-xs text-white/30 truncate">{address}</p>

			<input
				type="text"
				placeholder="Label (e.g. Home, Gym...)"
				value={label}
				onChange={(e) => setLabel(e.target.value)}
				className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-2 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
				autoFocus
			/>

			<div className="flex gap-2">
				{(["HOME", "WORK", "FAVOURITE"] as const).map((t) => (
					<Button
						key={t}
						type="button"
						onClick={() => setType(t)}
						className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
							type === t
								? "bg-blue-600 text-white border-blue-600"
								: "bg-white/5 text-white/50 border-white/10 hover:border-blue-500/50"
						}`}
					>
						{TYPE_ICONS[t]} {TYPE_LABELS[t]}
					</Button>
				))}
			</div>

			<Button
				type="button"
				onClick={handleSave}
				disabled={saving || !label.trim()}
				className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-40 transition-all"
			>
				{saving ? "Saving…" : "Save"}
			</Button>
		</div>
	);
}
