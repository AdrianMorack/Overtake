import { useState, useRef, useEffect } from "react";
import { Driver } from "../../types";

interface Props {
  drivers: Driver[];
  value: string;
  onChange: (driverCode: string) => void;
  label: string;
  placeholder?: string;
}

export function DriverAutocomplete({ drivers, value, onChange, label, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedDriver = drivers.find((d) => d.code === value);

  const filtered = drivers.filter((d) => {
    const q = query.toLowerCase();
    return (
      d.firstName.toLowerCase().includes(q) ||
      d.lastName.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs mb-2 text-muted-foreground telemetry-text">{label}</label>
      <input
        type="text"
        value={open ? query : selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName} (${selectedDriver.code})` : ""}
        placeholder={placeholder || "Search driver…"}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:border-theme-primary transition-colors text-sm"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-xl z-20 mt-1 p-0 list-none">
          {filtered.map((d) => (
            <li
              key={d.id}
              onClick={() => {
                onChange(d.code);
                setQuery("");
                setOpen(false);
              }}
              className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 hover:bg-muted/50 transition-colors text-sm ${
                d.code === value ? "bg-theme-primary/10 text-theme-primary" : ""
              }`}
            >
              {d.headshotUrl && (
                <img src={d.headshotUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
              )}
              <span>
                <strong>{d.code}</strong> — {d.firstName} {d.lastName}
              </span>
              {d.team && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {d.team.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
