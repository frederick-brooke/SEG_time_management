export default function PageSection({ children, className = "" }) {
  return (
    <section
      className={`relative py-20 px-6 bg-gray-950 text-white ${className}`}
    >
      {children}
    </section>
  );
}