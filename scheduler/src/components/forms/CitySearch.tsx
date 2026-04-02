/**
 * @file city-search.tsx
 * @description Controlled combobox for geographic city selection,
 * backed by the Nominatim OpenStreetMap geocoding API.
 */

"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from "@/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

interface CityOption {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface CityValue {
  name: string;
  lat: number;
  lng: number;
}

interface CitySearchProps {
  value?: CityValue;
  onChange: (city: CityValue) => void;
  placeholder?: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const RELEVANT_TYPES = new Set(["city", "town", "village", "municipality"]);
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Fetches filtered city results from the Nominatim geocoding API.
 *
 * @param {string} query - The user's search string
 * @param {AbortSignal} signal - AbortSignal to cancel stale in-flight requests
 * @returns {Promise<CityOption[]>} A filtered array of relevant city options
 * @throws {Error} On non-OK HTTP response
 */
async function fetchCities(query: string, signal: AbortSignal): Promise<CityOption[]> {
  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=10&dedupe=1&extratags=1`;
  const response = await fetch(url, { signal });

  if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

  const data: CityOption[] = await response.json();
  return data.filter(
    (item) => RELEVANT_TYPES.has(item.type) || item.importance > 0.3
  );
}

/**
 * Manages debounced city search state against the Nominatim API.
 *
 * @param {string} query - The live search string from the input
 * @returns {{ cities: CityOption[]; loading: boolean; error: string | null }} Search results, loading state, and any fetch error
 */
function useCitySearch(query: string) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      setCities([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setCities(await fetchCities(query, controller.signal));
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Failed to load cities. Please try again.");
        setCities([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return { cities, loading, error };
}

/**
 * Trigger button displaying the currently selected city or placeholder.
 *
 * @param {{ value: CityValue | null; placeholder: string; loading: boolean; open: boolean }} props
 * @returns {JSX.Element} The trigger button element
 */
function CitySearchTrigger({ value, placeholder, loading, open }: {
  value: CityValue | null | undefined;
  placeholder: string;
  loading: boolean;
  open: boolean;
}) {
  const label = value ? value.name : placeholder;

  return (
    <Button
      variant="outline"
      aria-expanded={open}
      aria-label={label}
      disabled={loading}
      className="w-full justify-between"
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {value
          ? <span className="truncate">{value.name}</span>
          : <span className="text-muted-foreground">{placeholder}</span>
        }
      </div>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
    </Button>
  );
}

/**
 * Dropdown content containing the search input and city results list.
 *
 * @param {{ searchTerm: string; onSearchChange: (val: string) => void; cities: CityOption[]; selectedName: string | undefined; onSelectCity: (city: CityOption) => void; loading: boolean; error: string | null }} props
 * @returns {JSX.Element} The dropdown command palette element
 */
function CitySearchDropdown({ searchTerm, onSearchChange, cities, selectedName, onSelectCity, loading, error }: {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  cities: CityOption[];
  selectedName: string | undefined;
  onSelectCity: (city: CityOption) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <Command>
      <CommandInput placeholder="Type a city name..." value={searchTerm} onValueChange={onSearchChange} />
      <CommandList>
        <CommandEmpty>
          {loading && "Searching..."}
          {error && <span className="text-destructive">{error}</span>}
          {!loading && !error && "No cities found."}
        </CommandEmpty>
        <CommandGroup>
          {cities.map((city) => (
            <CommandItem
              key={`${city.lat}-${city.lon}`}
              value={city.display_name}
              onSelect={() => onSelectCity(city)}
            >
              <Check className={cn("mr-2 h-4 w-4", selectedName === city.display_name ? "opacity-100" : "opacity-0")} />
              <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
              <span className="truncate">{city.display_name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/**
 * Controlled city search combobox backed by the Nominatim geocoding API.
 *
 * @param {CitySearchProps} props - Component props including value, onChange handler, and placeholder
 * @returns {JSX.Element} The city search combobox element
 */
export function CitySearch({ value, onChange, placeholder = "Search for a city..." }: CitySearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { cities, loading, error } = useCitySearch(searchTerm);

  const onSelectCity = (city: CityOption) => {
    onChange({ name: city.display_name, lat: parseFloat(city.lat), lng: parseFloat(city.lon) });
    setOpen(false);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <CitySearchTrigger value={value} placeholder={placeholder} loading={loading} open={open} />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <CitySearchDropdown
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          cities={cities}
          selectedName={value?.name}
          onSelectCity={onSelectCity}
          loading={loading}
          error={error}
        />
      </PopoverContent>
    </Popover>
  );
}