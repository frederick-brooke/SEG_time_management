export default function GlowBackground() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] pointer-events-none">
      <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(90,150,255,0.12),transparent_70%)]" />
    </div>
  );
}