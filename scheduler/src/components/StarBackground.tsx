"use client";

/**
 * StarBackground — reusable full-screen twinkling star field.
 * Drop anywhere; stars render fixed behind all page content.
 * Matches the landing page implementation exactly.
 */

import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";

export default function StarBackground() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const stars = useMemo(() => {
		if (!mounted) return [];
		return Array.from({ length: 90 }, (_, i) => ({
			id: i,
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 2 + 0.6,
			delay: Math.random() * 5,
			duration: Math.random() * 3 + 2,
		}));
	}, [mounted]);

	if (!mounted) return null;

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				pointerEvents: "none",
				zIndex: 0,
				overflow: "hidden",
			}}
		>
			{stars.map((s) => (
				<motion.div
					key={s.id}
					className="absolute rounded-full bg-white"
					style={{
						width: `${s.size}px`,
						height: `${s.size}px`,
						left: `${s.x}%`,
						top: `${s.y}%`,
					}}
					animate={{
						opacity: [0.15, 0.85, 0.15],
						scale: [1, 1.35, 1],
					}}
					transition={{
						duration: s.duration,
						delay: s.delay,
						repeat: Infinity,
						ease: "easeInOut",
					}}
				/>
			))}
		</div>
	);
}
