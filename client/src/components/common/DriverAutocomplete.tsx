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
    <div ref={ref} style={{ position: "relative", marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>{label}</label>
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
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: 6,
          fontSize: 14,
        }}
      />
      {open && filtered.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            maxHeight: 200,
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            listStyle: "none",
            margin: 0,
            padding: 0,
            zIndex: 10,
          }}
        >
          {filtered.map((d) => (
            <li
              key={d.id}
              onClick={() => {
                onChange(d.code);
                setQuery("");
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: d.code === value ? "#e8f4fd" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = d.code === value ? "#e8f4fd" : "transparent")
              }
            >
              {d.headshotUrl && (
                <img src={d.headshotUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
              )}
              <span>
                <strong>{d.code}</strong> — {d.firstName} {d.lastName}
              </span>
              {d.team && (
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
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
