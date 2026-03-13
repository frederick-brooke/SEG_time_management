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
    <form onSubmit={handleSubmit} className="flex items-center">
      <IconSearch className="mr-2" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="border rounded px-2 py-1"
      />
    </form>
  );
}