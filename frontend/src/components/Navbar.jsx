import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const active = (path) => loc.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-[#2DD4A7] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#2DD4A7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-[#111827] text-[17px]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CareerLens
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { to: "/analyze", label: "Analyze" },
            { to: "/analyze#results", label: "Results" },
            { to: "/cv-maker", label: "CV Maker" },
            { to: "/analyze#history", label: "History" },
          ].map(({ to, label }) => (
            <Link
              key={label}
              to={to}
              className={`text-[15px] font-medium transition-colors ${
                active(to.split("#")[0])
                  ? "text-[#2D2A6E]"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/analyze"
            className="hidden md:inline-flex items-center px-5 py-2.5 rounded-full bg-[#2D2A6E] text-white text-[14px] font-semibold hover:bg-[#3D3A9E] transition-colors"
          >
            Analyze My CV
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4">
          {[
            { to: "/analyze", label: "Analyze" },
            { to: "/cv-maker", label: "CV Maker" },
          ].map(({ to, label }) => (
            <Link
              key={label}
              to={to}
              className="text-[15px] font-medium text-[#6B7280] hover:text-[#111827]"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/analyze"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#2D2A6E] text-white text-sm font-semibold"
            onClick={() => setOpen(false)}
          >
            Analyze My CV
          </Link>
        </div>
      )}
    </nav>
  );
}
