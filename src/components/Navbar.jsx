import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, UserButton } from "@clerk/clerk-react";
import { Key, Menu, User, X } from "lucide-react";
import logo from "../assets/logo.png";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Doctors", href: "/doctors" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const STORAGE_KEY = "doctorToken_v1";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [doctorLoggedIn, setDoctorLoggedIn] = useState(() => Boolean(localStorage.getItem(STORAGE_KEY)));
  const location = useLocation();
  const clerk = useClerk();

  useEffect(() => {
    const refresh = () => setDoctorLoggedIn(Boolean(localStorage.getItem(STORAGE_KEY)));
    window.addEventListener("storage", refresh);
    window.addEventListener("doctor-auth-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("doctor-auth-change", refresh);
    };
  }, []);

  const itemClass = (href) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      location.pathname === href ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="MediCare" className="h-11 w-11 rounded-md object-contain" />
          <span>
            <span className="block text-lg font-bold text-slate-950">MediCare</span>
            <span className="block text-xs text-slate-500">Healthcare Solutions</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} className={itemClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <SignedOut>
            <Link to="/doctor-admin/login" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <User size={16} /> Doctor
            </Link>
            <button onClick={() => clerk.openSignIn()} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white">
              <Key size={16} /> Patient Login
            </button>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          {doctorLoggedIn && (
            <Link to="/doctor-dashboard" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Doctor Dashboard
            </Link>
          )}
        </div>

        <button onClick={() => setOpen((value) => !value)} className="rounded-md border border-slate-200 p-2 lg:hidden">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className={itemClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <Link to="/doctor-admin/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600">
              Doctor Login
            </Link>
            {doctorLoggedIn && (
              <Link to="/doctor-dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600">
                Doctor Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
