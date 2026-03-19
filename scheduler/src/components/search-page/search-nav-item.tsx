import { useState } from "react";
import { useRouter } from "next/router";
import { IconSearch } from "@tabler/icons-react"; // adjust to your icon import


//if free then fix this by adding in dynamic typing and navigation instead of a link only
export default function SearchNavItem() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== "") {
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1 hover:border-blue-400/50 focus-within:border-blue-500 transition-all duration-300">
      <IconSearch className="text-white/70" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="bg-transparent flex-1 text-white placeholder:text-white/50 focus:outline-none"
      />
    </form>
  );
}