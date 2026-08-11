import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Plus,
  Stethoscope,
  TestTube2,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Request failed");
  return body;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6">{children}</main>
    </div>
  );
}

function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    waiting: "bg-amber-50 text-amber-700 border-amber-200",
    junior_done: "bg-sky-50 text-sky-700 border-sky-200",
    "in-progress": "bg-violet-50 text-violet-700 border-violet-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    canceled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${map[status] || map.waiting}`}>
      {String(status || "waiting").replaceAll("_", " ")}
    </span>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const load = async () => {
    const [dashboard, appointmentsBody, doctorsBody] = await Promise.all([
      api("/api/appointments/dashboard/all"),
      api("/api/appointments"),
      api("/api/doctors"),
    ]);
    setStats(dashboard);
    setAppointments(appointmentsBody.appointments || []);
    setDoctors(doctorsBody.doctors || doctorsBody.data || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const queue = appointments
    .filter((a) => ["waiting", "junior_done", "in-progress"].includes(a.status))
    .slice(0, 8);

  return (
    <Shell>
      <PageTitle title="Dashboard" subtitle="Live hospital overview for patients, queue and doctors." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat icon={<Users size={22} />} label="Total Patients" value={stats?.totalPatients ?? 0} />
        <Stat icon={<CalendarClock size={22} />} label="Waiting" value={stats?.waiting ?? 0} />
        <Stat icon={<CheckCircle2 size={22} />} label="Completed" value={stats?.completed ?? 0} />
        <Stat icon={<XCircle size={22} />} label="Canceled" value={stats?.canceled ?? 0} />
        <Stat icon={<Stethoscope size={22} />} label="Doctors" value={doctors.length} />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Current Queue</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Queue</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((a) => (
                <tr key={a._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold">#{a.queueNumber}</td>
                  <td className="px-4 py-3">{a.patientName}</td>
                  <td className="px-4 py-3">{a.doctorName || a.doctorId?.name}</td>
                  <td className="px-4 py-3">{a.date} {a.time}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
              {!queue.length && <tr><td className="px-4 py-6 text-slate-500" colSpan="5">No active patients in queue.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function DoctorForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
    role: "senior",
    fee: "",
    experience: "",
    location: "",
    about: "",
  });
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await api("/api/doctors", { method: "POST", body: JSON.stringify(form) });
    setMessage("Doctor added successfully.");
    setForm({ name: "", email: "", password: "", specialization: "", role: "senior", fee: "", experience: "", location: "", about: "" });
  };

  return (
    <Shell>
      <PageTitle title="Add Doctor" subtitle="Create junior or senior doctors used by the queue workflow." />
      <form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        {["name", "email", "password", "specialization", "fee", "experience", "location"].map((name) => (
          <label key={name} className="text-sm font-medium capitalize">
            {name}
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500"
              type={name === "password" ? "password" : name === "fee" ? "number" : "text"}
              value={form[name]}
              onChange={(e) => setForm({ ...form, [name]: e.target.value })}
              required={["name", "email", "password", "specialization"].includes(name)}
            />
          </label>
        ))}
        <label className="text-sm font-medium">
          Role
          <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="senior">Senior</option>
            <option value="junior">Junior</option>
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-2">
          About
          <textarea className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" rows="4" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </label>
        <button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white">
          <Plus size={18} /> Add Doctor
        </button>
        {message && <p className="self-center text-sm text-emerald-700">{message}</p>}
      </form>
    </Shell>
  );
}

function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api("/api/doctors").then((b) => setDoctors(b.doctors || b.data || []));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const filtered = useMemo(() => doctors.filter((d) => `${d.name} ${d.specialization} ${d.role || d.raw?.role}`.toLowerCase().includes(q.toLowerCase())), [doctors, q]);
  const remove = async (id) => {
    await api(`/api/doctors/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <Shell>
      <PageTitle title="Doctors" subtitle="Doctor records with specialization and junior/senior roles." />
      <input className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 md:w-96" placeholder="Search doctors" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => (
          <article key={d._id || d.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{d.name}</h2>
                <p className="text-sm text-slate-500">{d.specialization}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{d.role || d.raw?.role || "senior"}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{d.about || "No profile notes added."}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Fee: ₹{d.fee || 0}</span>
              <button onClick={() => remove(d._id || d.id)} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-3 py-1.5 text-rose-700">
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const load = () => api("/api/appointments").then((b) => setAppointments(b.appointments || []));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const act = async (path) => {
    await api(path, { method: "POST" });
    load();
  };

  return (
    <Shell>
      <PageTitle title="Appointments & Queue" subtitle="Move patients through waiting, junior_done, completed, or canceled." />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Queue</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold">#{a.queueNumber}</td>
                <td className="px-4 py-3">{a.patientName}<div className="text-xs text-slate-500">{a.mobile}</div></td>
                <td className="px-4 py-3">{a.doctorName || a.doctorId?.name}</td>
                <td className="px-4 py-3">{a.date} {a.time}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="space-x-2 px-4 py-3">
                  {a.status === "waiting" && <button className="rounded-md bg-sky-50 px-2 py-1 text-sky-700" onClick={() => act(`/api/appointments/junior/${a._id}`)}>Junior done</button>}
                  {["junior_done", "in-progress"].includes(a.status) && <button className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700" onClick={() => act(`/api/appointments/complete/${a._id}`)}>Complete</button>}
                  <button className="rounded-md bg-rose-50 px-2 py-1 text-rose-700" onClick={() => act(`/api/appointments/${a._id}/cancel`)}>Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function ServiceForm() {
  const [form, setForm] = useState({ name: "", specialization: "Diagnostics", shortDescription: "", price: "", about: "", instructions: "" });
  const [message, setMessage] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    await api("/api/services", {
      method: "POST",
      body: JSON.stringify({ ...form, instructions: form.instructions.split(",").map((x) => x.trim()).filter(Boolean) }),
    });
    setMessage("Service added successfully.");
    setForm({ name: "", specialization: "Diagnostics", shortDescription: "", price: "", about: "", instructions: "" });
  };
  return (
    <Shell>
      <PageTitle title="Add Service" subtitle="Create non-doctor services such as blood test and X-ray." />
      <form onSubmit={submit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        {["name", "specialization", "shortDescription", "price"].map((name) => (
          <label key={name} className="text-sm font-medium capitalize">
            {name}
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" type={name === "price" ? "number" : "text"} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required={name === "name"} />
          </label>
        ))}
        <label className="text-sm font-medium md:col-span-2">
          About
          <textarea className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" rows="3" value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Instructions, comma separated
          <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </label>
        <button className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white"><Plus size={18} /> Add Service</button>
        {message && <p className="self-center text-sm text-emerald-700">{message}</p>}
      </form>
    </Shell>
  );
}

function ServiceList() {
  const [services, setServices] = useState([]);
  const load = () => api("/api/services").then((b) => setServices(b.data || []));
  useEffect(() => {
    load().catch(console.error);
  }, []);
  const remove = async (id) => {
    await api(`/api/services/${id}`, { method: "DELETE" });
    load();
  };
  return (
    <Shell>
      <PageTitle title="Services" subtitle="Independent hospital service catalogue." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <article key={s._id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div><h2 className="font-semibold">{s.name}</h2><p className="text-sm text-slate-500">{s.shortDescription || s.specialization}</p></div>
              <TestTube2 className="text-emerald-700" />
            </div>
            <p className="mt-3 text-sm text-slate-600">{s.about || "No details added."}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-medium">₹{s.price || 0}</span>
              <button onClick={() => remove(s._id)} className="rounded-md bg-rose-50 px-3 py-1.5 text-sm text-rose-700">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function ServiceAppointments() {
  const [items, setItems] = useState([]);
  const load = () => api("/api/service-appointments").then((b) => setItems(b.appointments || []));
  useEffect(() => {
    load().catch(console.error);
  }, []);
  const update = async (id, status) => {
    await api(`/api/service-appointments/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  };
  return (
    <Shell>
      <PageTitle title="Service Appointments" subtitle="Bookings for lab, X-ray and other non-doctor services." />
      <div className="grid gap-4">
        {items.map((a) => (
          <article key={a._id} className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div>
              <h2 className="font-semibold">{a.patientName} - {a.serviceName}</h2>
              <p className="text-sm text-slate-500">{a.mobile} | {a.date} {a.hour}:{String(a.minute).padStart(2, "0")} {a.ampm}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={a.status} />
              <button className="rounded-md bg-emerald-50 px-2 py-1 text-sm text-emerald-700" onClick={() => update(a._id, "completed")}>Complete</button>
              <button className="rounded-md bg-rose-50 px-2 py-1 text-sm text-rose-700" onClick={() => update(a._id, "canceled")}>Cancel</button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function ServiceDashboard() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api("/api/service-appointments").then((b) => setItems(b.appointments || [])).catch(console.error);
  }, []);
  return (
    <Shell>
      <PageTitle title="Service Dashboard" subtitle="Analytics for non-doctor service bookings." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<ClipboardList size={22} />} label="Total Bookings" value={items.length} />
        <Stat icon={<Activity size={22} />} label="Waiting" value={items.filter((x) => x.status === "waiting").length} />
        <Stat icon={<CheckCircle2 size={22} />} label="Completed" value={items.filter((x) => x.status === "completed").length} />
      </div>
    </Shell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/add" element={<DoctorForm />} />
      <Route path="/list" element={<DoctorList />} />
      <Route path="/appointments" element={<AppointmentPage />} />
      <Route path="/service-dashboard" element={<ServiceDashboard />} />
      <Route path="/add-service" element={<ServiceForm />} />
      <Route path="/list-service" element={<ServiceList />} />
      <Route path="/service-appointments" element={<ServiceAppointments />} />
    </Routes>
  );
}
