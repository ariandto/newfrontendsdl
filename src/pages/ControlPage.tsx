import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import { ArrowLeft } from "lucide-react";

interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

interface StatusData {
  door: string;
  alarm: string;
  updatedAt?: string;
}

const ControlPage: React.FC = () => {
  // ------------------------------------------------------------------
  //  STATE                                                           
  // ------------------------------------------------------------------
  const [user, setUser]           = useState<UserProfile | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>(""); // pesan sukses/error
  const [statusData, setStatusData] = useState<StatusData>({ door: "", alarm: "" });
  const [loading, setLoading]     = useState(false);
  const [darkMode, setDarkMode]   = useState(() =>
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const navigate = useNavigate();

  // ------------------------------------------------------------------
  //  THEME HANDLER                                                   
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  //  CHECK SESSION & FETCH INITIAL STATUS                            
  // ------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        // validasi session ------------------------------------------------
        const sessionRes = await apiClient.get("/checkSession", { withCredentials: true });
        setUser(sessionRes.data.user);

        // ambil status terkini -------------------------------------------
        const statusRes = await apiClient.get<StatusData>("/status", { withCredentials: true });
        setStatusData(statusRes.data);
      } catch (err) {
        console.warn("❌ Session invalid. Redirecting to login.");
        setUser(null);
        navigate("/");
      }
    };
    init();
  }, [navigate]);

  // ------------------------------------------------------------------
  //  HANDLERS                                                        
  // ------------------------------------------------------------------
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleBack     = () => navigate("/dashboard");

  const handleControl  = async (action: "open" | "close") => {
    try {
      setLoading(true);
      setStatusMsg("");
      const res = await apiClient.post("/control", { action }, { withCredentials: true });

      // update pesan & state pintu lokal --------------------------------
      setStatusMsg(res.data.message || "Berhasil");
      setStatusData((prev) => ({ ...prev, door: action === "open" ? "Terbuka" : "Tertutup" }));

      // hide pesan setelah 5 detik
      setTimeout(() => setStatusMsg(""), 5000);
    } catch (e: any) {
      console.error("❌ Gagal kirim aksi:", e);
      setStatusMsg("Gagal mengirim perintah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Logout?")) return;
    await apiClient.post("/logout", {}, { withCredentials: true });
    window.location.href = "/";
  };

  // ------------------------------------------------------------------
  //  RENDER HELPERS                                                  
  // ------------------------------------------------------------------
  const doorIsOpen  = statusData.door.toLowerCase() === "terbuka";
  const doorIsClose = statusData.door.toLowerCase() === "tertutup";

  // disable open if already open; disable close if already close------
  const disabledOpen  = loading || doorIsOpen;
  const disabledClose = loading || doorIsClose;

  const statusColor = doorIsOpen ? "bg-green-500" : doorIsClose ? "bg-red-500" : "bg-gray-400";

  // ------------------------------------------------------------------
  //  UI                                                              
  // ------------------------------------------------------------------
  if (!user) return null; // (redirect handled above)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          {/* Back btn + title */}
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Kembali">
            <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Panel Kontrol</h1>
          </div>
          {/* Right side */}
          <div className="flex items-center gap-4">
            <button onClick={toggleDarkMode} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Toggle dark mode">
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400">Logout</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* STATUS RING */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-4 h-4 rounded-full ${statusColor} animate-pulse`} />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Pintu: {statusData.door || "-"}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* OPEN --------------------------------------------------- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-3xl shadow mb-4">🔓</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Buka Pintu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Buka kunci pintu untuk akses masuk</p>
            <button
              onClick={() => handleControl("open")}
              disabled={disabledOpen}
              className={`w-full py-4 px-6 rounded-xl font-bold shadow-lg transition transform flex items-center justify-center gap-2 ${
                disabledOpen
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105"
              } text-white`}
            >
              {loading && !disabledClose ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Membuka...
                </>
              ) : (
                "Buka Pintu"
              )}
            </button>
          </div>

          {/* CLOSE -------------------------------------------------- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-3xl shadow mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Kunci Pintu</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Kunci pintu untuk keamanan</p>
            <button
              onClick={() => handleControl("close")}
              disabled={disabledClose}
              className={`w-full py-4 px-6 rounded-xl font-bold shadow-lg transition transform flex items-center justify-center gap-2 ${
                disabledClose
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 hover:scale-105"
              } text-white`}
            >
              {loading && !disabledOpen ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Mengunci...
                </>
              ) : (
                "Tutup Pintu"
              )}
            </button>
          </div>
        </div>

        {/* STATUS MSG */}
        {statusMsg && (
          <div className={`rounded-xl p-6 mb-8 border transition-all duration-300 ${
            statusMsg.toLowerCase().includes("gagal")
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          }`}>{statusMsg}</div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Smart Door Lock Control Panel. Secure & Reliable.</p>
          <p className="mt-1">Terakhir diakses: {new Date().toLocaleString("id-ID")}</p>
        </footer>
      </main>
    </div>
  );
};

export default ControlPage;
