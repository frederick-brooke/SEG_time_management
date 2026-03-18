export default function SectionTitle({ children }) {
  return (
    <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
      {children}
    </h2>
  );
}