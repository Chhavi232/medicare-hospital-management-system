import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { CalendarClock, CheckCircle2, ClipboardList, Stethoscope, TestTube2, Users } from "lucide-react";

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

const today = new Date().toISOString().slice(0, 10);

function Field({ label, children }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{icon}</span>
        <span>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
        </span>
      </div>
    </div>
  );
}

const Home = () => {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [doctorBooking, setDoctorBooking] = useState({
    doctorId: "",
    patientName: "",
    mobile: "",
    age: "",
    gender: "",
    date: today,
    time: "10:00 AM",
  });
  const [serviceBooking, setServiceBooking] = useState({
    serviceId: "",
    patientName: "",
    mobile: "",
    age: "",
    gender: "",
    date: today,
    time: "09:00 AM",
    paymentMethod: "Cash",
  });
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [doctorBody, serviceBody, dashboardBody] = await Promise.all([
      api("/api/doctors"),
      api("/api/services"),
      api("/api/appointments/dashboard/all"),
    ]);
    const doctorList = doctorBody.doctors || doctorBody.data || [];
    const serviceList = serviceBody.data || [];
    setDoctors(doctorList);
    setServices(serviceList);
    setStats(dashboardBody);
    setDoctorBooking((current) => ({ ...current, doctorId: current.doctorId || doctorList[0]?._id || doctorList[0]?.id || "" }));
    setServiceBooking((current) => ({ ...current, serviceId: current.serviceId || serviceList[0]?._id || "" }));
  };

  useEffect(() => {
    load().catch((err) => setNotice(err.message));
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s._id === serviceBooking.serviceId),
    [services, serviceBooking.serviceId]
  );

  const bookDoctor = async (e) => {
    e.preventDefault();
    const body = await api("/api/appointments", {
      method: "POST",
      body: JSON.stringify(doctorBooking),
    });
    setNotice(`Appointment booked. Queue number: ${body.queueNumber}. Estimated wait: ${body.waitTime} minutes.`);
    setDoctorBooking((b) => ({ ...b, patientName: "", mobile: "", age: "", gender: "" }));
    load();
  };

  const bookService = async (e) => {
    e.preventDefault();
    await api("/api/service-appointments", {
      method: "POST",
      body: JSON.stringify({
        ...serviceBooking,
        amount: selectedService?.price || 0,
      }),
    });
    setNotice("Service booking created successfully.");
    setServiceBooking((b) => ({ ...b, patientName: "", mobile: "", age: "", gender: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">Hospital Management System</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              Structured patient flow from booking to senior doctor completion.
            </h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Book doctor appointments, manage junior review, call the next patient by queue, and keep lab services separate from doctor visits.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat icon={<Users size={22} />} label="Total Patients" value={stats?.totalPatients ?? 0} />
            <Stat icon={<CalendarClock size={22} />} label="Waiting" value={stats?.waiting ?? 0} />
            <Stat icon={<CheckCircle2 size={22} />} label="Completed" value={stats?.completed ?? 0} />
            <Stat icon={<Stethoscope size={22} />} label="Doctors" value={doctors.length} />
          </div>
        </section>

        {notice && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <form onSubmit={bookDoctor} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Stethoscope className="text-emerald-700" />
              <div>
                <h2 className="text-lg font-semibold">Book Doctor Appointment</h2>
                <p className="text-sm text-slate-500">Status starts as waiting and enters FIFO queue.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Doctor">
                <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.doctorId} onChange={(e) => setDoctorBooking({ ...doctorBooking, doctorId: e.target.value })} required>
                  {doctors.map((d) => <option key={d._id || d.id} value={d._id || d.id}>{d.name} - {d.specialization}</option>)}
                </select>
              </Field>
              <Field label="Patient Name">
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.patientName} onChange={(e) => setDoctorBooking({ ...doctorBooking, patientName: e.target.value })} required />
              </Field>
              <Field label="Mobile">
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.mobile} onChange={(e) => setDoctorBooking({ ...doctorBooking, mobile: e.target.value })} required />
              </Field>
              <Field label="Age">
                <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.age} onChange={(e) => setDoctorBooking({ ...doctorBooking, age: e.target.value })} />
              </Field>
              <Field label="Gender">
                <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.gender} onChange={(e) => setDoctorBooking({ ...doctorBooking, gender: e.target.value })}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Date">
                <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.date} onChange={(e) => setDoctorBooking({ ...doctorBooking, date: e.target.value })} required />
              </Field>
              <Field label="Time">
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={doctorBooking.time} onChange={(e) => setDoctorBooking({ ...doctorBooking, time: e.target.value })} required />
              </Field>
            </div>
            <button className="mt-5 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white">Book Appointment</button>
          </form>

          <form onSubmit={bookService} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TestTube2 className="text-emerald-700" />
              <div>
                <h2 className="text-lg font-semibold">Book Service</h2>
                <p className="text-sm text-slate-500">Blood test, X-ray and diagnostics stay separate.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service">
                <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.serviceId} onChange={(e) => setServiceBooking({ ...serviceBooking, serviceId: e.target.value })} required>
                  {services.map((s) => <option key={s._id} value={s._id}>{s.name} - ₹{s.price || 0}</option>)}
                </select>
              </Field>
              <Field label="Patient Name">
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.patientName} onChange={(e) => setServiceBooking({ ...serviceBooking, patientName: e.target.value })} required />
              </Field>
              <Field label="Mobile">
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.mobile} onChange={(e) => setServiceBooking({ ...serviceBooking, mobile: e.target.value })} required />
              </Field>
              <Field label="Age">
                <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.age} onChange={(e) => setServiceBooking({ ...serviceBooking, age: e.target.value })} />
              </Field>
              <Field label="Gender">
                <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.gender} onChange={(e) => setServiceBooking({ ...serviceBooking, gender: e.target.value })}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Date">
                <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.date} onChange={(e) => setServiceBooking({ ...serviceBooking, date: e.target.value })} required />
              </Field>
              <Field label="Time">
                <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={serviceBooking.time} onChange={(e) => setServiceBooking({ ...serviceBooking, time: e.target.value })} required />
              </Field>
            </div>
            <button className="mt-5 rounded-md bg-emerald-600 px-4 py-2 font-medium text-white">Book Service</button>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="text-emerald-700" />
            <h2 className="text-xl font-semibold">Available Doctors</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((d) => (
              <article key={d._id || d.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold">{d.name}</h3>
                <p className="text-sm text-slate-500">{d.specialization} | {(d.role || d.raw?.role || "senior").toUpperCase()}</p>
                <p className="mt-2 text-sm text-slate-600">{d.about || "Experienced hospital doctor available for appointments."}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
