import React from "react";
import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6">
        <h1 className="text-3xl font-bold">About MediCare</h1>
        <p className="mt-4 text-slate-600">
          MediCare manages hospital appointments through a structured queue. Patients book visits, junior doctors finish first review, senior doctors call the next reviewed patient, and admin monitors doctors, services, appointments, and dashboard analytics.
        </p>
      </main>
    </div>
  );
}
