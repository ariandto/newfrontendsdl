import React, { useEffect, useState, FormEvent } from "react";
import { AlertTriangle, MailPlus, Trash2, Shield, Mail, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import DeleteAccessModal from "../modals/deleteAccessModal";

interface AllowedEmail {
  email: string;
}

const SettingPage: React.FC = () => {
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const navigate = useNavigate();

  // Theme toggle
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

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const { data } = await apiClient.get("/allowed-emails", {
          withCredentials: true,
        });
        setEmails(data.emails.map((e: string) => ({ email: e })));
        setIsAdmin(true);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setIsAdmin(false);
        } else {
          setError("Gagal memuat data");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    try {
      await apiClient.post(
        "/allowed-emails",
        { email: newEmail.trim() },
        { withCredentials: true }
      );
      setEmails((prev) => [...prev, { email: newEmail.trim().toLowerCase() }]);
      setNewEmail("");
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menambah email");
    }
  };

  const openDeleteModal = (email: string) => {
    setEmailToDelete(email);
    setShowDeleteModal(true);
  };

   const handleDeleteConfirmed = async () => {
    if (!emailToDelete) return;
    setModalLoading(true);
    try {
      await apiClient.delete(
        `/allowed-emails/${encodeURIComponent(emailToDelete)}`,
        { withCredentials: true }
      );
      setEmails((prev) =>
        prev.filter((e) => e.email !== emailToDelete)
      );
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menghapus email");
    } finally {
      setModalLoading(false);
      setShowDeleteModal(false);
      setEmailToDelete(null);
    }
  };

  const handleBack = () => navigate("/dashboard");

  const handleLogout = async () => {
    if (window.confirm("Logout?")) {
      await apiClient.post("/logout", {}, { withCredentials: true });
      window.location.href = "/";
    }
  };

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Pengaturan Akses
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center transition-colors duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Akses Terbatas</h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Anda tidak memiliki hak untuk mengelola daftar email. Hubungi administrator untuk mendapatkan akses.
              </p>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm font-medium">
                <Shield className="w-4 h-4 mr-2" />
                Memerlukan Izin Admin
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Pengaturan Akses Email
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Email Terdaftar</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{emails.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status Sistem</p>
              <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Aktif</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Email Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <MailPlus className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Tambah Email
              </h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition-colors duration-200"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MailPlus className="h-5 w-5" />
                  Tambah Email
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700 dark:text-red-400 font-medium text-sm">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-green-700 dark:text-green-500" />
                  Daftar Email Terdaftar
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Hanya email yang ada di daftar ini yang dapat mengakses sistem
                </p>
              </div>
              
              <div className="p-6">
                {emails.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Belum ada email terdaftar</p>
                    <p className="text-gray-400 dark:text-gray-500">Tambahkan email pertama untuk memulai</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emails.map(({ email }, index) => (
                      <div
                        key={email}
                        className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-300 flex items-center justify-center shadow-sm">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{email}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Email aktif</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openDeleteModal(email)}
                          className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="Hapus email"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Smart Door Lock System. All rights reserved.</p>
          <p className="mt-1">
            Sistem akan otomatis menyimpan perubahan yang Anda buat
          </p>
        </footer>
      </main>
    </div>
      <DeleteAccessModal
      open={showDeleteModal}
      title="Hapus Akses Email"
      message={`Apakah Anda yakin ingin menghapus akses untuk ${emailToDelete}?`}
      confirmLabel="Hapus"
      cancelLabel="Batal"
      onConfirm={handleDeleteConfirmed}
      onClose={() => {
        setShowDeleteModal(false);
        setEmailToDelete(null);
      }}
      loading={modalLoading}
    />
  </>
  );
};



export default SettingPage;