import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Stethoscope } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/doctors`)
      .then((res) => res.json())
      .then((body) => setDoctors(body.doctors || body.data || []))
      .catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Stethoscope className="text-emerald-700" />
          <div>
            <h1 className="text-3xl font-bold">Doctors</h1>
            <p className="text-sm text-slate-500">Junior and senior doctors used in appointment assignment.</p>
          </div>
        </div>
        {message && <p className="mb-4 text-sm text-rose-600">{message}</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <article key={doctor._id || doctor.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{doctor.name}</h2>
                  <p className="text-sm text-slate-500">{doctor.specialization}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium uppercase text-emerald-700">
                  {doctor.role || doctor.raw?.role || "senior"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{doctor.about || "Available for hospital consultations."}</p>
              <p className="mt-3 text-sm font-medium">Fee: Rs. {doctor.fee || 0}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
