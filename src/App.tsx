// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ControlPage from "./pages/ControlPage";
import DashboardPage from "./pages/DashboardPage";
import AccessLogPage from "./pages/AccessLog";
import SettingPage from "./pages/SettingPage";

const App: React.FC = () => {
  useEffect(() => {
    let deferredPrompt: any;

    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log("🆗 Aplikasi bisa di-install");

      // Otomatis tampilkan prompt install setelah 1 detik
      setTimeout(() => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
        }
      }, 1000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/control" element={<ControlPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<AccessLogPage />} />
        <Route path="/access-setting" element={<SettingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
