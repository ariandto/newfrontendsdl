import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import LogoutModal from "../modals/logoutModal";
import {
  Settings2,
  ListChecks,
  Users2,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

interface UserProfile {
  email: string;
  name: string;
  photoURL: string;
}

interface StatusData {
  door: string;
  alarm: string;
}

const DashboardPage: React.FC = () => {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<StatusData>({ door: "", alarm: "" });
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [loading, setLoading] = useState(true);

  // Logout‑modal state
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // EFFECTS – THEME TOGGLE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ---------------------------------------------------------------------------
  // EFFECTS – CHECK SESSION + FETCH STATUS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/checkSession", { withCredentials: true });
        const { email, name, photoURL } = res.data.user;
        setUser({ email, name, photoURL });

        const statusRes = await apiClient.get("/status", { withCredentials: true });
        setStatus(statusRes.data);
      } catch (err) {
        console.warn("❌ Session invalid. Redirecting to login.");
        setUser(null);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  const handleLogoutConfirm = useCallback(async () => {
    try {
      setLogoutLoading(true);
      await apiClient.post("/logout", {}, { withCredentials: true });
      navigate("/");
    } catch (error) {
      console.error("❌ Logout error", error);
      alert("Logout gagal. Coba lagi.");
    } finally {
      setLogoutLoading(false);
    }
  }, [navigate]);

  const handleControlPage = () => navigate("/control");
  const handleAccessLogPage = () => navigate("/history");
  const handleAccessSettingPage = () => navigate("/access-setting");

  // ---------------------------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------------------------
  const getStatusIcon = (type: string, value: string) => {
    if (type === "door") return value.toLowerCase() === "terbuka" ? "🔓" : "🔒";
    return value.toLowerCase() === "aktif" ? "🚨" : "🔕";
  };

  const getStatusColor = (type: string, value: string) => {
    if (type === "door") {
      return value.toLowerCase() === "terbuka"
        ? "text-red-600 dark:text-red-400"
        : "text-green-600 dark:text-green-400";
    }
    return value.toLowerCase() === "aktif"
      ? "text-orange-600 dark:text-orange-400"
      : "text-gray-600 dark:text-gray-400";
  };

  // ---------------------------------------------------------------------------
  // RENDER – LOADING STATE
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Memuat data...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER – MAIN CONTENT
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Smart Door Lock</h1>
          <div className="flex items-center gap-4">
            {/* THEME TOGGLE */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* LOGOUT BUTTON */}
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition">
            <div className="flex flex-col items-center text-center">
              {user?.photoURL ? (
                <div className="relative">
                  <img
                    src={user.photoURL}
                    alt="Foto Profil"
                    className="w-24 h-24 rounded-full mb-4 border-4 border-blue-200 dark:border-blue-800 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl text-white font-bold">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {user?.name || "Pengguna"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{user?.email}</p>
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status Sistem</h3>
            <div className="space-y-4">
              {/* Door */}
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon("door", status.door)}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Status Pintu</p>
                    <p className={`text-sm font-semibold ${getStatusColor("door", status.door)}`}>{status.door || "Tidak diketahui"}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.door?.toLowerCase() === "terbuka" ? "bg-red-500 animate-pulse" : "bg-green-500"
                  }`}
                />
              </div>

              {/* Alarm */}
              <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon("alarm", status.alarm)}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Status Alarm</p>
                    <p className={`text-sm font-semibold ${getStatusColor("alarm", status.alarm)}`}>{status.alarm || "Tidak diketahui"}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    status.alarm?.toLowerCase() === "aktif" ? "bg-orange-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons Section */}
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 max-w-2xl mx-auto">
            <button
              onClick={handleControlPage}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 w-full"
            >
              <Settings2 size={22} />
              <span className="text-base sm:text-lg">Panel Kontrol</span>
            </button>
            <button
              onClick={handleAccessLogPage}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 w-full"
            >
              <ListChecks size={22} />
              <span className="text-base sm:text-lg">Riwayat</span>
            </button>
            <button
              onClick={handleAccessSettingPage}
              className="bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 w-full"
            >
              <Users2 size={22} />
              <span className="text-base sm:text-lg">Manage Access</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Smart Door Lock System. All rights reserved.</p>
          <p className="mt-1">Terakhir diperbarui: {new Date().toLocaleString("id-ID")}</p>
        </footer>
      </main>

      {/* Logout Modal */}
      <LogoutModal
        open={logoutOpen}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sistem?"
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogoutConfirm}
        loading={logoutLoading}
      />
    </div>
  );
};

export default DashboardPage;
