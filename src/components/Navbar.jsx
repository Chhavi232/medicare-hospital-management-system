import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";

import logoImg from "../assets/admin_images/logo.png";
import { navbarStyles as ns } from "../assets/admin_images/dummyStyles";

import {
  Link,
  useLocation,
  useNavigate,
  NavLink,
} from "react-router-dom";

import { useAuth, useUser, useClerk } from "@clerk/clerk-react";

import {
  X,
  Menu,
  Home,
  UserPlus,
  Calendar,
  Users,
  Grid,
  PlusSquare,
  List,
} from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const navInnerRef = useRef(null);
  const indicatorRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();


  const clerk = useClerk();

  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // ---------------- Indicator ----------------
  const moveIndicator = useCallback(() => {
    const container = navInnerRef.current;
    const ind = indicatorRef.current;

    if (!container || !ind) return;

    const active = container.querySelector(".nav-item.active");

    if (!active) {
      ind.style.opacity = "0";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const left =
      activeRect.left - containerRect.left + container.scrollLeft;

    ind.style.transform = `translateX(${left}px)`;
    ind.style.width = `${activeRect.width}px`;
    ind.style.opacity = "1";
  }, []);

  useLayoutEffect(() => {
    moveIndicator();
    const t = setTimeout(moveIndicator, 120);
    return () => clearTimeout(t);
  }, [location.pathname, moveIndicator]);

  useEffect(() => {
    const container = navInnerRef.current;
    if (!container) return;

    const onScroll = () => moveIndicator();
    container.addEventListener("scroll", onScroll);

    const ro = new ResizeObserver(moveIndicator);
    ro.observe(container);

    window.addEventListener("resize", moveIndicator);

    return () => {
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", moveIndicator);
    };
  }, [moveIndicator]);

  // ---------------- Escape close ----------------
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------------- Clerk token ----------------
  useEffect(() => {
    let mounted = true;

    const storeToken = async () => {
      if (!authLoaded || !userLoaded) return;

      if (!isSignedIn) {
        localStorage.removeItem("clerk_token");
        return;
      }

      try {
        const token = await getToken();
        if (mounted && token) {
          localStorage.setItem("clerk_token", token);
        }
      } catch (err) {
        console.warn("Token error", err);
      }
    };

    storeToken();
    return () => (mounted = false);
  }, [isSignedIn, authLoaded, userLoaded, getToken]);

  // ---------------- Auth ----------------
  const handleOpenSignIn = () => {
    if (!clerk?.openSignIn) return;
    clerk.openSignIn();
    navigate("/"); 
  };

  const handleSignOut = async () => {
    try {
      await clerk.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem("clerk_token");
      navigate("/");
    }
  };

  // ---------------- UI ----------------
  return (
    <header className={ns.header}>
      <nav className={ns.navContainer}>
        <div className={ns.flexContainer}>
          {/* LOGO */}
          <div className={ns.logoContainer}>
            <img src={logoImg} alt="logo" className={ns.logoImage} />

            <Link to="/">
              <div className={ns.logoLink}>MediCare</div>
              <div className={ns.logoSubtext}>
                Healthcare Solutions
              </div>
            </Link>
          </div>

          {/* CENTER NAV */}
          <div className={ns.centerNavContainer}>
            <div className={ns.glowEffect}>
              <div className={ns.centerNavInner}>
                <div
                  ref={navInnerRef}
                  className={ns.centerNavScrollContainer}
                >
                  <CenterNavItem to="/" label="Dashboard" icon={<Home size={16} />} />
                  <CenterNavItem to="/add" label="Add Doctor" icon={<UserPlus size={16} />} />
                  <CenterNavItem to="/list" label="List Doctors" icon={<Users size={16} />} />
                  <CenterNavItem to="/appointments" label="Appointments" icon={<Calendar size={16} />} />
                  <CenterNavItem to="/service-dashboard" label="Service Dashboard" icon={<Grid size={16} />} />
                  <CenterNavItem to="/add-service" label="Add Service" icon={<PlusSquare size={16} />} />
                  <CenterNavItem to="/list-service" label="List Services" icon={<List size={16} />} />
                  <CenterNavItem to="/service-appointments" label="Service Appointments" icon={<Calendar size={16} />} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className={ns.rightContainer}>
            {isSignedIn ? (
              <button onClick={handleSignOut} className={ns.signOutButton}>
                Sign Out
              </button>
            ) : (
              <button onClick={handleOpenSignIn} className={ns.loginButton}>
                Login
              </button>
            )}

            <button
              onClick={() => setOpen(!open)}
              className={ns.mobileMenuButton}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* mobile navigation */}
{open && (
  <>
    {/* overlay */}
    <div
      className={ns.mobileOverlay}
      onClick={() => setOpen(false)}
    />

    {/* menu */}
    <div
      className={ns.mobileMenuContainer}
      id="mobile-menu"
    >
      <div className={ns.mobileMenuInner}>
        <MobileItem
          to="/"
          label="Dashboard"
          icon={<Home size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/add"
          label="Add Doctor"
          icon={<UserPlus size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/list"
          label="List Doctors"
          icon={<Users size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/appointments"
          label="Appointments"
          icon={<Calendar size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/service-dashboard"
          label="Service Dashboard"
          icon={<Grid size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/add-service"
          label="Add Service"
          icon={<PlusSquare size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/list-service"
          label="List Services"
          icon={<List size={16} />}
          onClick={() => setOpen(false)}
        />

        <MobileItem
          to="/service-appointments" 
          label="Service Appointments"
          icon={<Calendar size={16} />}
          onClick={() => setOpen(false)}
        />
        <div className={ns.mobileAuthContainer}>
  {isSignedIn ? (
    <button
      onClick={() => {
        handleSignOut();
        setOpen(false);
      }}
      className={ns.mobileSignOutButton}
    >
      Sign Out
    </button>
  ) : (
    <div className="space-y-2">
      <button
        onClick={() => {
          handleOpenSignIn();
          setOpen(false);
        }}
        className={ns.mobileLoginButton + " " + ns.cursorPointer}
      >
        Login
      </button>
    </div>
  )}
</div> 
      </div>
    </div>
  </>
)}
      </nav>
    </header>
  );
};

export default Navbar;

// ---------------- COMPONENTS ----------------

function CenterNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function MobileItem({ to, icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}