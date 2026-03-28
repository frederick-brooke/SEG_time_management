"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CityOption {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface CitySearchProps {
  value?: { name: string; lat: number; lng: number } | null;
  onChange: (city: { name: string; lat: number; lng: number } | null) => void;
  placeholder?: string;
}

export function CitySearch({ value, onChange, placeholder = "Search for a city..." }: CitySearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout| null>(null);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setCities([]);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchTerm
          )}&addressdetails=1&limit=10&dedupe=1&extratags=1`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cities");
        }

        const data: CityOption[] = await response.json();
        // Filter for cities, towns, etc.
        const filteredCities = data.filter(
          (item) =>
            item.type === "city" ||
            item.type === "town" ||
            item.type === "village" ||
            item.type === "municipality" ||
            item.importance > 0.3 // Include important places
        );
        setCities(filteredCities);
      } catch (error) {
        console.error("Error searching cities:", error);
        setCities([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSelect = (city: CityOption) => {
    onChange({
      name: city.display_name,
      lat: parseFloat(city.lat),
      lng: parseFloat(city.lon),
    });
    setOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {value ? (
              <span className="truncate">{value.name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command className="">
          <CommandInput
            placeholder="Type a city name..."
            value={searchTerm}
            onValueChange={setSearchTerm}
			className=""
          />
          <CommandList className="">
            <CommandEmpty>
              {loading ? "Searching..." : "No cities found."}
            </CommandEmpty>
            <CommandGroup className="">
              {cities.map((city) => (
                <CommandItem
					className=""
                  key={`${city.lat}-${city.lon}`}
                  value={city.display_name}
                  onSelect={() => handleSelect(city)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.name === city.display_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <MapPin className="mr-2 h-4 w-4" />
                  <span className="truncate">{city.display_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}