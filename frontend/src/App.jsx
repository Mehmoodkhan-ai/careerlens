import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Home from "./pages/Home.jsx";
import Analyze from "./pages/Analyze.jsx";
import CVMaker from "./pages/CVMaker.jsx";

export default function App() {
  useEffect(() => {
    const dark = localStorage.getItem("cv-analyzer-dark") === "true";
    if (dark) document.documentElement.classList.add("dark");
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/cv-maker" element={<CVMaker />} />
      </Routes>
    </BrowserRouter>
  );
}
