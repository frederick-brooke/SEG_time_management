"use client";
import { useEffect, useRef,  useCallback } from "react";

interface Star {
	x: number;
	y: number;
	baseOpacity: number;
	size: number;
	twinkleSpeed: number;
	twinkleOffset: number;
	currentOpacity: number;
}

const STAR_COUNT = 200;
const PROXIMITY_RADIUS = 200;
const GLOW_STRENGTH = 2;
const THROTTLE_RATE = 16;

export default function StarField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const starsRef = useRef<Star[]>([]);
	const mouseRef = useRef({ x: -9999, y: -9999 });
	const animationIdRef = useRef<number>(undefined); // ← added undefined
	const lastMouseUpdateRef = useRef(0);

	useEffect(() => {
		const initializeStars = () => {
			const stars: Star[] = [];
			for (let i = 0; i < STAR_COUNT; i++) {
				stars.push({
					x: Math.random() * window.innerWidth,
					y: Math.random() * window.innerHeight,
					baseOpacity: Math.random() * 0.5 + 0.3,
					size: Math.random() * 1.5 + 0.5,
					twinkleSpeed: Math.random() * 0.03 + 0.01,
					twinkleOffset: Math.random() * Math.PI * 2,
					currentOpacity: 0.5,
				});
			}
			starsRef.current = stars;
		};
		initializeStars();

		const handleResize = () => {
			if (canvasRef.current) {
				canvasRef.current.width = window.innerWidth;
				canvasRef.current.height = window.innerHeight;
			}
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		const now = Date.now();
		if (now - lastMouseUpdateRef.current < THROTTLE_RATE) return;
		lastMouseUpdateRef.current = now;
		mouseRef.current = { x: e.clientX, y: e.clientY };
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		let frameCount = 0;

		const animate = () => {
			frameCount++;
			ctx.fillStyle = "rgba(3, 7, 18, 0.2)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const mouse = mouseRef.current;

			starsRef.current.forEach((star) => {
				const dx = star.x - mouse.x;
				const dy = star.y - mouse.y;
				const distance = Math.hypot(dx, dy);
				const isNear = distance < PROXIMITY_RADIUS;

				const twinkle =
					(Math.sin(
						frameCount * star.twinkleSpeed + star.twinkleOffset,
					) +
						1) /
					2;
				const proximityBoost = isNear
					? Math.max(0, 1 - distance / PROXIMITY_RADIUS) *
						GLOW_STRENGTH
					: 0;
				star.currentOpacity =
					star.baseOpacity + twinkle * 0.3 + proximityBoost;

				ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, star.currentOpacity)})`;
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
				ctx.fill();

				if (isNear && proximityBoost > 0.1) {
					ctx.fillStyle = `rgba(200, 220, 255, ${proximityBoost * 0.3})`;
					ctx.beginPath();
					ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
					ctx.fill();
				}
			});

			animationIdRef.current = requestAnimationFrame(animate);
		};

		window.addEventListener("mousemove", handleMouseMove);
		animationIdRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (animationIdRef.current)
				cancelAnimationFrame(animationIdRef.current);
		};
	}, [handleMouseMove]);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 pointer-events-none"
			style={{ width: "100%", height: "100%" }}
		/>
	);
}
