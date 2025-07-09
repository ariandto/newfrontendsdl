import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import DeleteModal from "../modals/deleteModal";
import { ArrowLeft } from "lucide-react";

interface AccessLog {
  id: string;
  timestamp: string;
  method: string;
  user: string;
  door: string;
  alarm: string;
}

interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

const ROWS_PER_PAGE = 10;

const AccessLogPage: React.FC = () => {
  /* ------------------------------------------------------------
   * Local state
   * ---------------------------------------------------------- */
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const navigate = useNavigate();

  // pagination
  const [currentPage, setCurrentPage] = useState(1);

  // date filter (YYYY-MM-DD)
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  /* ------------------------------------------------------------
   * Modal state
   * ---------------------------------------------------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(async () => {});

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
  //  CHECK SESSION & FETCH INITIAL DATA                             
  // ------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        // validasi session ------------------------------------------------
        const sessionRes = await apiClient.get("/checkSession", { withCredentials: true });
        setUser(sessionRes.data.user);

        // fetch logs -----------------------------------------------------
        const { data } = await apiClient.get<{ total: number; logs: AccessLog[] }>("/access-logs", {
          withCredentials: true,
        });
        setLogs(data.logs || []);
      } catch (err: any) {
        console.warn("❌ Session invalid. Redirecting to login.");
        setUser(null);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  // ------------------------------------------------------------------
  //  HANDLERS                                                        
  // ------------------------------------------------------------------
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const handleBack = () => navigate("/dashboard");

  const handleLogout = async () => {
    if (!window.confirm("Logout?")) return;
    await apiClient.post("/logout", {}, { withCredentials: true });
    window.location.href = "/";
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  /* ------------------------------------------------------------
   * Helpers to open modal with dynamic action
   * ---------------------------------------------------------- */
  const openDeleteModal = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setConfirmAction(() => action);
    setModalOpen(true);
  };

  const handleConfirm = useCallback(async () => {
    setModalLoading(true);
    await confirmAction();
    setModalLoading(false);
    setModalOpen(false);
  }, [confirmAction]);

  /* ------------------------------------------------------------
   * Delete single log
   * ---------------------------------------------------------- */
  const deleteLog = async (id: string) => {
    openDeleteModal("Hapus Riwayat", "Apakah Anda yakin ingin menghapus riwayat ini?", async () => {
      try {
        await apiClient.delete(`/access-logs/${id}`, { withCredentials: true });
        setLogs((prev) => prev.filter((log) => log.id !== id));
      } catch (err) {
        alert("Gagal menghapus riwayat.");
      }
    });
  };

  /* ------------------------------------------------------------
   * Delete all logs
   * ---------------------------------------------------------- */
  const deleteAll = async () => {
    if (logs.length === 0) return;
    openDeleteModal(
      "Hapus Semua Riwayat",
      "Apakah Anda yakin ingin menghapus semua riwayat akses?",
      async () => {
        try {
          await apiClient.delete(`/access-logs`, { withCredentials: true });
          setLogs([]);
          setCurrentPage(1);
        } catch (err) {
          alert("Gagal menghapus semua riwayat.");
        }
      }
    );
  };

  /* ------------------------------------------------------------
   * Derived data – filtering & pagination
   * ---------------------------------------------------------- */
  const filteredLogs = useMemo(() => {
    if (!startDate && !endDate) return logs;

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      if (start && logDate < start) return false;
      if (end && logDate > end) return false;
      return true;
    });
  }, [logs, startDate, endDate]);

  const totalPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE) || 1;

  const currentLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredLogs.slice(startIdx, startIdx + ROWS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // reset to page 1 when filter changes or pages drop below current page
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  /* ------------------------------------------------------------
   * Render states
   * ---------------------------------------------------------- */
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 transition-colors dark:from-gray-900 dark:to-gray-800">
        <p className="text-lg text-gray-700 dark:text-gray-300">Memuat data…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 transition-colors dark:from-gray-900 dark:to-gray-800">
        <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
      </div>
    );

  if (!user) return null; // (redirect handled above)

  /* ------------------------------------------------------------
   * Main return (table + modal)
   * ---------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 transition-colors duration-300 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          {/* Back btn + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Akses</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={deleteAll}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition hover:bg-red-700"
            >
              <span>🗑️</span>
              <span className="hidden md:inline">Hapus Semua</span>
            </button>
            <button
              onClick={deleteAll}
              className="sm:hidden p-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              aria-label="Hapus Semua"
            >
              🗑️
            </button>
            <Link
              to="/control"
              className="hidden sm:inline-flex rounded-lg bg-green-600 px-3 py-2 text-sm text-white transition hover:bg-green-700"
            >
              <span className="hidden md:inline">Panel </span>Kontrol
            </Link>
            <Link
              to="/control"
              className="sm:hidden p-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
              aria-label="Panel Kontrol"
            >
              
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Date filter */}
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
            <label className="mb-1 font-medium">Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
            <label className="mb-1 font-medium">Sampai</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="text-gray-700 dark:text-gray-300">
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Tanggal & Waktu</th>
                  <th className="px-4 py-3 font-medium">Metode</th>
                  <th className="px-4 py-3 font-medium">Pengguna</th>
                  <th className="px-4 py-3 font-medium">Status Pintu</th>
                  <th className="px-4 py-3 font-medium">Status Alarm</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Belum ada data akses.
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className={idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-900" : "bg-white dark:bg-gray-800"}
                    >
                      <td className="whitespace-nowrap px-4 py-3">{idx + 1 + (currentPage - 1) * ROWS_PER_PAGE}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDateTime(log.timestamp)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{log.method}</td>
                      <td className="whitespace-nowrap px-4 py-3">{log.user}</td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 font-semibold ${
                          log.door.toLowerCase() === "terbuka"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {log.door}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 font-semibold ${
                          log.alarm.toLowerCase() === "alarm!"
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {log.alarm}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:underline"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
            <div className="text-gray-700 dark:text-gray-300">
              Menampilkan {currentLogs.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1}–
              {(currentPage - 1) * ROWS_PER_PAGE + currentLogs.length} dari {filteredLogs.length} entri
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  currentPage === 1
                    ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isActive = currentPage === page;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-blue-600 font-semibold text-white dark:bg-blue-500"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  currentPage === totalPages
                    ? "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Smart Door Lock Control Panel. Secure & Reliable.</p>
          <p className="mt-1">Terakhir diakses: {new Date().toLocaleString("id-ID")}</p>
        </footer>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={modalOpen}
        loading={modalLoading}
        title={modalTitle}
        message={modalMessage}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleConfirm}
        onClose={() => (modalLoading ? null : setModalOpen(false))}
      />
    </div>
  );
};

export default AccessLogPage;