import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const STORAGE_KEY = "doctorToken_v1";
const DOCTOR_KEY = "doctorProfile_v1";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    const res = await fetch(`${API_BASE}/api/doctors/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      setMessage(body.message || "Login failed");
      return;
    }
    localStorage.setItem(STORAGE_KEY, body.token);
    localStorage.setItem(DOCTOR_KEY, JSON.stringify(body.data));
    window.dispatchEvent(new Event("doctor-auth-change"));
    navigate("/doctor-dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-md px-4 pb-12 pt-28 sm:px-6">
        <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold">Doctor Login</h1>
          <label className="mt-5 block text-sm font-medium">
            Email
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Password
            <input type="password" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          {message && <p className="mt-4 text-sm text-rose-600">{message}</p>}
          <button className="mt-5 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white">Login</button>
        </form>
      </main>
    </div>
  );
}
