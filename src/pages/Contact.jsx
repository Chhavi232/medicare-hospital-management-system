import React from "react";
import Navbar from "../components/Navbar";

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-28 sm:px-6">
        <h1 className="text-3xl font-bold">Contact</h1>
        <div className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-600">Reception: +91 98765 43210</p>
          <p className="mt-2 text-slate-600">Email: support@medicare.local</p>
          <p className="mt-2 text-slate-600">Address: Main Hospital Road, City Center</p>
        </div>
      </main>
    </div>
  );
}
