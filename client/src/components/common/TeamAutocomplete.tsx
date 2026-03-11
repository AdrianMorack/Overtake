import { useState, useRef, useEffect } from "react";
import { Team } from "../../types";

interface Props {
  teams: Team[];
  value: string;
  onChange: (teamName: string) => void;
  label: string;
  placeholder?: string;
}

export function TeamAutocomplete({ teams, value, onChange, label, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

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
        value={open ? query : value}
        placeholder={placeholder || "Search team…"}
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
          {filtered.map((t) => (
            <li
              key={t.id}
              onClick={() => {
                onChange(t.name);
                setQuery("");
                setOpen(false);
              }}
              className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 hover:bg-muted/50 transition-colors text-sm ${
                t.name === value ? "bg-theme-primary/10 text-theme-primary" : ""
              }`}
            >
              {t.color && (
                <span
                  className="w-3.5 h-3.5 rounded-full inline-block flex-shrink-0"
                  style={{ background: t.color }}
                />
              )}
              <span>{t.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
