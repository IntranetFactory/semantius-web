import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";

import { cn, interpolate } from "@/lib/utils";
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

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
}

export interface APISelectProps<T> {
  /** URL template for searching. Use ${query} as placeholder for search term */
  searchUrl?: string;
  /** URL template for fetching a single record by ID. Use ${id} as placeholder */
  idUrl?: string;
  /** Async function to fetch options (takes priority over searchUrl when set) */
  fetcher?: (query?: string) => Promise<T[]>;
  /** Async function to resolve initial value to option (takes priority over idUrl when set) */
  recordFetcher?: (value: string) => Promise<T | null>;
  /** Extract the results array from the API response. String extracts a named property; function for custom extraction */
  getRecords?: ((data: unknown) => T[]) | string;
  /** Preload all data ahead of time */
  preload?: boolean;
  /** Function to filter options */
  filterFn?: (option: T, query: string) => boolean;
  /** Render the item content (used in trigger and as fallback for dropdown). String is interpolated with the record */
  renderItem: ((option: T) => React.ReactNode) | string;
  /** Get the unique identifier from a record. String is interpolated with the record */
  getRecordId: ((option: T) => string) | string;
  /** Render each option in the dropdown list (falls back to renderItem). String is interpolated with the record */
  renderListItem?: ((option: T) => React.ReactNode) | string;
  /** Class name for the item wrapper in the trigger */
  itemClassName?: string;
  /** Class name for the item wrapper in the dropdown list */
  listItemClassName?: string;
  /** Custom not found message */
  notFound?: React.ReactNode;
  /** Custom loading skeleton */
  loadingSkeleton?: React.ReactNode;
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Label for the select field */
  label: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Disable the entire select */
  disabled?: boolean;
  /** Custom width for the popover */
  width?: string | number;
  /** Custom class names */
  className?: string;
  /** Custom trigger button class names */
  triggerClassName?: string;
  /** Custom no results message */
  noResultsMessage?: string;
  /** Allow clearing the selection */
  clearable?: boolean;
}

export function APISelect<T>({
  searchUrl,
  idUrl,
  fetcher,
  recordFetcher,
  getRecords,
  preload,
  filterFn,
  renderItem: renderItemProp,
  getRecordId: getRecordIdProp,
  renderListItem: renderListItemProp,
  itemClassName = "flex items-center gap-2",
  listItemClassName = "flex items-center gap-2 text-left",
  notFound,
  loadingSkeleton,
  label,
  placeholder = "Select...",
  value,
  onChange,
  disabled = false,
  width = "200px",
  className,
  triggerClassName,
  noResultsMessage,
  clearable = true,
}: APISelectProps<T>) {
  const getRecordId = useMemo(() =>
    typeof getRecordIdProp === "string"
      ? (option: T) => interpolate(getRecordIdProp, option as Record<string, unknown>)
      : getRecordIdProp,
    [getRecordIdProp]
  );

  const renderItem = useMemo(() =>
    typeof renderItemProp === "string"
      ? (option: T) => interpolate(renderItemProp, option as Record<string, unknown>)
      : renderItemProp,
    [renderItemProp]
  );

  const renderListItem = useMemo(() => {
    if (renderListItemProp == null) return undefined;
    return typeof renderListItemProp === "string"
      ? (option: T) => interpolate(renderListItemProp, option as Record<string, unknown>)
      : renderListItemProp;
  }, [renderListItemProp]);

  const resolvedGetRecords = useMemo(() => {
    if (getRecords == null) return undefined;
    if (typeof getRecords === "string") {
      const key = getRecords;
      return (data: unknown) => {
        const val = (data as Record<string, unknown>)?.[key];
        return Array.isArray(val) ? val as T[] : [] as T[];
      };
    }
    return getRecords;
  }, [getRecords]);

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, preload ? 0 : 300);

  // Determine which fetchers to use (custom fetchers take priority over URLs)
  const effectiveFetcher = useCallback(
    async (query?: string): Promise<T[]> => {
      if (fetcher) return fetcher(query);
      if (searchUrl) {
        let url: string;
        if (query) {
          url = searchUrl.replace("${query}", encodeURIComponent(query));
        } else {
          // Remove query params that contain template placeholders, then fix leftover &/? issues
          url = searchUrl
            .replace(/([?&])[^?&]*\$\{[^}]*\}[^&]*/g, "$1")
            .replace(/[?&]$/, "")
            .replace(/\?&/, "?");
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
        const data = await res.json();
        return resolvedGetRecords ? resolvedGetRecords(data) : data;
      }
      return [];
    },
    [fetcher, searchUrl, resolvedGetRecords]
  );

  const effectiveRecordFetcher = useCallback(
    async (id: string): Promise<T | null> => {
      if (recordFetcher) return recordFetcher(id);
      if (idUrl) {
        const url = idUrl.replace("${id}", encodeURIComponent(id));
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json();
      }
      return null;
    },
    [recordFetcher, idUrl]
  );

  // TanStack Query for search results
  const {
    data: options = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: [searchUrl, debouncedSearchTerm, open],
    queryFn: async () => {
      if (preload && mounted && debouncedSearchTerm) {
        const all = await effectiveFetcher();
        return filterFn
          ? all.filter((option) => filterFn(option, debouncedSearchTerm))
          : all;
      }
      return effectiveFetcher(debouncedSearchTerm || undefined);
    },
    enabled: open || (preload === true),
    staleTime: 30_000,
  });

  // TanStack Query for initial option resolution
  const { data: initialOption, isLoading: initialLoading } = useQuery({
    queryKey: [idUrl, value],
    queryFn: () => effectiveRecordFetcher(value),
    enabled: !!value && !selectedOption,
    staleTime: Infinity,
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : "Failed to fetch options") : null;

  useEffect(() => {
    setMounted(true);
    setSelectedValue(value);
  }, [value]);

  // Set selected option from initial fetch
  useEffect(() => {
    if (initialOption && !selectedOption) {
      setSelectedOption(initialOption);
    }
  }, [initialOption, selectedOption]);

  // Update selectedOption when options are loaded and value exists
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find((opt) => getRecordId(opt) === value);
      if (option) {
        setSelectedOption(option);
      }
    }
  }, [value, options, getRecordId]);

  const handleSelect = useCallback(
    (currentValue: string) => {
      const newValue =
        clearable && currentValue === selectedValue ? "" : currentValue;
      setSelectedValue(newValue);
      setSelectedOption(
        options.find((option) => getRecordId(option) === newValue) || null
      );
      onChange(newValue);
      setOpen(false);
    },
    [selectedValue, onChange, clearable, options, getRecordId]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            disabled && "opacity-50 cursor-not-allowed",
            triggerClassName
          )}
          style={{ width: width }}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className={itemClassName}>{renderItem(selectedOption)}</div>
          ) : initialLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            placeholder
          )}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            {clearable && selectedValue && (
              <span
                role="button"
                aria-label="Clear selection"
                className="flex items-center justify-center"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedValue("");
                  setSelectedOption(null);
                  onChange("");
                }}
              >
                <X className="opacity-50 hover:opacity-100 h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="opacity-50" size={10} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0 w-[var(--radix-popover-trigger-width)]", className)}>
        <Command shouldFilter={false}>
          <div className="relative border-b w-full">
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onValueChange={(value) => {
                setSearchTerm(value);
              }}
            />
            {loading && options.length > 0 && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <CommandList>
            {error && (
              <div className="p-4 text-destructive text-center">
                {error}
              </div>
            )}
            {loading && options.length === 0 && (
              loadingSkeleton || <DefaultLoadingSkeleton />
            )}
            {!loading && !error && options.length === 0 && (
              notFound || <CommandEmpty>{noResultsMessage ?? `No ${label.toLowerCase()} found.`}</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={getRecordId(option)}
                  value={getRecordId(option)}
                  onSelect={handleSelect}
                >
                  <div className={listItemClassName}>{(renderListItem ?? renderItem)(option)}</div>
                  <Check
                    className={cn(
                      "ml-auto h-3 w-3",
                      selectedValue === getRecordId(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DefaultLoadingSkeleton() {
  return (
    <CommandGroup>
      {[1, 2, 3].map((i) => (
        <CommandItem key={i} disabled>
          <div className="flex items-center gap-2 w-full">
            <div className="h-6 w-6 rounded-full animate-pulse bg-muted" />
            <div className="flex flex-col flex-1 gap-1">
              <div className="h-4 w-24 animate-pulse bg-muted rounded" />
              <div className="h-3 w-16 animate-pulse bg-muted rounded" />
            </div>
          </div>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
