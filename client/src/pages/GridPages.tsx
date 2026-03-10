import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function CreateGridPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const grid = await api.createGrid(name);
      navigate(`/grids/${grid.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h2>Create a Grid</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Grid name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "10px 24px", background: "#e10600", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
          Create
        </button>
      </form>
    </div>
  );
}

export function JoinGridPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const grid = await api.joinGrid(code.toUpperCase());
      navigate(`/grids/${grid.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 24 }}>
      <h2>Join a Grid</h2>
      <p>Enter the 6-character code shared by a friend.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          maxLength={6}
          minLength={6}
          style={{ width: "100%", padding: "10px 12px", marginBottom: 12, border: "1px solid #ccc", borderRadius: 6, fontSize: 20, letterSpacing: 6, textAlign: "center", boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "10px 24px", background: "#e10600", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
          Join
        </button>
      </form>
    </div>
  );
}
