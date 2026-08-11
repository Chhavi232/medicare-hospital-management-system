import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { TestTube2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export default function Services() {
  const [services, setServices] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/services`)
      .then((res) => res.json())
      .then((body) => setServices(body.data || []))
      .catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <TestTube2 className="text-emerald-700" />
          <div>
            <h1 className="text-3xl font-bold">Services</h1>
            <p className="text-sm text-slate-500">Diagnostics and non-doctor hospital bookings.</p>
          </div>
        </div>
        {message && <p className="mb-4 text-sm text-rose-600">{message}</p>}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold">{service.name}</h2>
              <p className="text-sm text-slate-500">{service.shortDescription || service.specialization}</p>
              <p className="mt-3 text-sm text-slate-600">{service.about || "Service details will be shared at booking time."}</p>
              <p className="mt-3 text-sm font-medium">Price: Rs. {service.price || 0}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
