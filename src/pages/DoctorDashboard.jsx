import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const STORAGE_KEY = "doctorToken_v1";
const DOCTOR_KEY = "doctorProfile_v1";

function Badge({ status }) {
  const colors = {
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    junior_done: "bg-sky-50 text-sky-700 border-sky-200",
    "in-progress": "bg-violet-50 text-violet-700 border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    canceled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return <span className={`rounded-full border px-2 py-1 text-xs ${colors[status] || colors.waiting}`}>{String(status).replaceAll("_", " ")}</span>;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

  const load = async (profile) => {
    const res = await fetch(`${API_BASE}/api/appointments/doctor/${profile._id}`);
    const body = await res.json().catch(() => ({}));
    setAppointments(body.appointments || []);
  };

  useEffect(() => {
    const raw = localStorage.getItem(DOCTOR_KEY);
    if (!localStorage.getItem(STORAGE_KEY) || !raw) {
      navigate("/doctor-admin/login");
      return;
    }
    const profile = JSON.parse(raw);
    setDoctor(profile);
    load(profile).catch((err) => setMessage(err.message));
  }, [navigate]);

  const active = useMemo(() => appointments.filter((item) => ["waiting", "junior_done", "in-progress"].includes(item.status)), [appointments]);

  const post = async (path) => {
    setMessage("");
    const res = await fetch(`${API_BASE}${path}`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) setMessage(body.message || "Action failed");
    else setMessage(body.message || "Queue updated.");
    if (doctor) await load(doctor);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DOCTOR_KEY);
    window.dispatchEvent(new Event("doctor-auth-change"));
    navigate("/");
  };

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold">{doctor.name}</h1>
            <p className="text-sm text-slate-500">{doctor.specialization} | {String(doctor.role || "senior").toUpperCase()} doctor</p>
          </div>
          <button onClick={logout} className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">Logout</button>
        </div>
        {message && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
        {doctor.role === "senior" && (
          <button onClick={() => post(`/api/appointments/next/${doctor._id}`)} className="mb-4 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white">Call Next Junior-Reviewed Patient</button>
        )}
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Queue</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {active.map((appointment) => (
                <tr key={appointment._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">#{appointment.queueNumber}</td>
                  <td className="px-4 py-3">{appointment.patientName}<div className="text-xs text-slate-500">{appointment.mobile}</div></td>
                  <td className="px-4 py-3">{appointment.date} {appointment.time}</td>
                  <td className="px-4 py-3"><Badge status={appointment.status} /></td>
                  <td className="space-x-2 px-4 py-3">
                    {doctor.role === "junior" && appointment.status === "waiting" && (
                      <button onClick={() => post(`/api/appointments/junior/${appointment._id}`)} className="rounded-md bg-sky-50 px-2 py-1 text-sky-700">Junior done</button>
                    )}
                    {doctor.role === "senior" && ["junior_done", "in-progress"].includes(appointment.status) && (
                      <button onClick={() => post(`/api/appointments/complete/${appointment._id}`)} className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">Complete</button>
                    )}
                  </td>
                </tr>
              ))}
              {!active.length && <tr><td className="px-4 py-6 text-slate-500" colSpan="5">No active appointments.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
