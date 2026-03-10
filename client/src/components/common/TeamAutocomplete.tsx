import React, { useState, useRef, useEffect } from "react";
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
    <div ref={ref} style={{ position: "relative", marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>{label}</label>
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
          {filtered.map((t) => (
            <li
              key={t.id}
              onClick={() => {
                onChange(t.name);
                setQuery("");
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: t.name === value ? "#e8f4fd" : "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = t.name === value ? "#e8f4fd" : "transparent")
              }
            >
              {t.color && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: t.color,
                    display: "inline-block",
                  }}
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
