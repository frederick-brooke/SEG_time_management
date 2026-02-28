import { useState } from "react";

export function useFilters(defaultValues) {
  const [filters, setFilters] = useState(defaultValues);

  function reset() {
    setFilters(defaultValues);
  }

  return { filters, setFilters, reset };
}