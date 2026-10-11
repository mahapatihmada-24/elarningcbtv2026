import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  FileText,
  Award,
  Users,
  Settings,
  AlertCircle,
  WifiOff,
  GraduationCap,
  LayoutDashboard,
  Database,
  School,
  ShieldAlert,
  ChevronDown,
  Layers,
  Megaphone,
  Bell,
} from 'lucide-react';
import { User, Ujian, SchoolProfile, Announcement } from './types';
import { api, DataSource, subscribeDataSource, normalizeUser, cleanupLocalStorage } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { AdminView } from './components/AdminView';
import { AdminDashboard } from './components/AdminView/AdminDashboard';
import { AdminMasterData } from './components/AdminView/AdminMasterData';
import { AdminSchoolSettings } from './components/AdminView/AdminSchoolSettings';
import { GuruMateri } from './components/GuruView/GuruMateri';
import { GuruCBT } from './components/GuruView/GuruCBT';
import { GuruNilai } from './components/GuruView/GuruNilai';
import { MuridMateri } from './components/MuridView/MuridMateri';
import { MuridCBTList } from './components/MuridView/MuridCBTList';
import { CBTExamActive } from './components/MuridView/CBTExamActive';
import { AnnouncementBoard } from './components/AnnouncementBoard';
import { NotificationModal, getUnreadAnnouncementsCount } from './components/NotificationModal';
import { AnnouncementAlertBanner } from './components/AnnouncementAlertBanner';
import { YouTubeModal } from './components/YouTubeModal';
import { ImageModal } from './components/ImageModal';
import { ConfirmModal, ModalState } from './components/ConfirmModal';
import { GasSettingsModal } from './components/GasSettingsModal';
import { ParentPinModal } from './components/ParentPortal/ParentPinModal';
import { ParentDashboardModal } from './components/ParentPortal/ParentDashboardModal';

const SESSION_KEY = 'elearning_user_session';
const TAB_KEY = 'elearning_active_tab';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('admin_dashboard');
  const [activeExam, setActiveExam] = useState<Ujian | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('LOCAL');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);

  // Announcements and Notifications state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Modals state
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParentPinModalOpen, setIsParentPinModalOpen] = useState(false);
  const [isParentDashboardOpen, setIsParentDashboardOpen] = useState(false);
  const initialModalState: ModalState = {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    isConfirm: false,
    okText: 'OK',
    cancelText: 'Batal',
    onConfirm: undefined,
    onCancel: undefined,
  };

  const [modalState, setModalState] = useState<ModalState>(initialModalState);

  const handleCloseModal = () => {
    setModalState(initialModalState);
  };

  const handleShowModal = (modal: Partial<ModalState>) => {
    setModalState({
      isOpen: true,
      title: modal.title || '',
      message: modal.message || '',
      type: modal.type || 'info',
      isConfirm: modal.isConfirm ?? false,
      okText: modal.okText || (modal.isConfirm ? 'Konfirmasi' : 'OK'),
      cancelText: modal.cancelText || 'Batal',
      onConfirm: modal.onConfirm,
      onCancel: modal.onCancel,
    });
  };

  // Load school profile for session timeout & school metadata
  useEffect(() => {
    api.getSchoolProfile().then((p) => {
      if (p) setSchoolProfile(p);
    });
  }, []);

  // Check connectivity & restore session
  useEffect(() => {
    // Jalankan pembersihan awal untuk membebaskan kuota LocalStorage browser HP
    cleanupLocalStorage();

    const handleOnline = () => {
      setIsOnline(true);
      cleanupLocalStorage();
      api.syncPendingSubmissions().catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Coba kirimkan antrean darurat jika ada sisa data di perangkat
    api.syncPendingSubmissions().catch(() => {});

    const unsubscribe = subscribeDataSource((src) => setDataSource(src));

    // Restore saved session
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const userObj = normalizeUser(parsed);
          setCurrentUser(userObj);
          const savedTab = localStorage.getItem(TAB_KEY);
          if (savedTab) {
            setActiveTab(savedTab);
          } else {
            setActiveTab(userObj.role === 'admin' ? 'admin_dashboard' : 'materi');
          }
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // SESSION TIMEOUT LISTENER (Requirement 8)
  const lastActivityRef = useRef<number>(Date.now());

  const handleSessionTimeout = useCallback(() => {
    const timeoutMinutes = schoolProfile?.sessionTimeoutMinutes || 30;
    setCurrentUser(null);
    setActiveExam(null);
    localStorage.removeItem(SESSION_KEY);
    handleShowModal({
      title: 'Sesi Telah Berakhir',
      message: `Anda telah tidak aktif selama lebih dari ${timeoutMinutes} menit. Demi keamanan data akun Anda, sistem secara otomatis telah mengakhiri sesi. Silakan login kembali.`,
      type: 'warning',
      isConfirm: false,
      okText: 'Mengerti',
    });
  }, [schoolProfile?.sessionTimeoutMinutes]);

  useEffect(() => {
    if (!currentUser) return;

    const timeoutMinutes = schoolProfile?.sessionTimeoutMinutes || 30;
    lastActivityRef.current = Date.now();

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    // Check every 10 seconds
    const interval = setInterval(() => {
      // Don't auto-timeout if student is in the middle of active exam, or check limit
      if (activeExam) return;
      const elapsedMs = Date.now() - lastActivityRef.current;
      const limitMs = timeoutMinutes * 60 * 1000;
      if (elapsedMs >= limitMs) {
        handleSessionTimeout();
      }
    }, 10000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
      clearInterval(interval);
    };
  }, [currentUser, activeExam, schoolProfile?.sessionTimeoutMinutes, handleSessionTimeout]);

  // ANNOUNCEMENTS & NOTIFICATIONS SYNC
  const refreshAnnouncements = useCallback(async () => {
    if (!currentUser) return;
    try {
      const list = await api.getAnnouncements();
      setAnnouncements(list || []);
      const count = getUnreadAnnouncementsCount(list || [], currentUser);
      setUnreadNotificationsCount(count);
    } catch (err) {
      console.warn('Gagal memuat pengumuman:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshAnnouncements();
      // Periodically sync announcements every 30 seconds
      const timer = setInterval(() => {
        refreshAnnouncements();
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [currentUser, refreshAnnouncements]);

  // Filter announcements for current user's role:
  const visibleAnnouncements = announcements.filter((item) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'guru') return item.target === 'semua' || item.target === 'guru';
    if (currentUser.role === 'murid') return item.target === 'semua' || item.target === 'murid';
    return true;
  });

  // LOGIN HANDLER (Requirement 5)
  const handleLogin = (user: User) => {
    const cleanUser = normalizeUser(user);
    setCurrentUser(cleanUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(cleanUser));

    // Admin goes to Dashboard Admin (Requirement 5)
    if (cleanUser.role === 'admin') {
      setActiveTab('admin_dashboard');
      localStorage.setItem(TAB_KEY, 'admin_dashboard');
    } else {
      setActiveTab('materi');
      localStorage.setItem(TAB_KEY, 'materi');
    }
  };

  // LOGOUT HANDLER (Requirement 7)
  const handleLogout = () => {
    if (activeExam) {
      handleShowModal({
        title: 'Konfirmasi Keluar',
        message: 'Ujian sedang berlangsung! Jika Anda keluar sekarang, sesi ujian akan terhenti.',
        type: 'danger',
        isConfirm: true,
        okText: 'Tetap Keluar',
        cancelText: 'Lanjutkan Ujian',
        onConfirm: () => {
          setActiveExam(null);
          setCurrentUser(null);
          localStorage.removeItem(SESSION_KEY);
        },
      });
      return;
    }

    handleShowModal({
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari sistem E-Learning & CBT?',
      type: 'question',
      isConfirm: true,
      okText: 'Ya, Keluar',
      cancelText: 'Batal',
      onConfirm: () => {
        setCurrentUser(null);
        setActiveExam(null);
        localStorage.removeItem(SESSION_KEY);
      },
    });
  };

  const normalizeTab = (rawTab: string): string => {
    switch (rawTab) {
      case 'murid-mode':
      case 'murid':
      case 'murid-cbt':
      case 'murid_cbt':
        return 'murid_cbt';
      case 'murid-materi':
      case 'murid_materi':
        return 'murid_materi';
      case 'admin-school':
      case 'admin_school':
      case 'admin-settings':
      case 'admin_settings':
        return 'admin_settings';
      case 'admin-users':
      case 'admin_users':
        return 'admin_users';
      case 'admin-master':
      case 'admin_master':
        return 'admin_master';
      case 'admin-dashboard':
      case 'admin_dashboard':
        return 'admin_dashboard';
      case 'guru-materi':
      case 'guru_materi':
        return 'guru_materi';
      case 'guru-cbt':
      case 'guru_cbt':
        return 'guru_cbt';
      case 'guru-nilai':
      case 'guru_nilai':
        return 'guru_nilai';
      case 'pengumuman':
      case 'announcement':
      case 'announcements':
      case 'papan_pengumuman':
      case 'papan-pengumuman':
        return 'pengumuman';
      case 'admin-announcements':
      case 'admin_announcements':
      case 'admin_pengumuman':
      case 'admin-pengumuman':
        return 'admin_announcements';
      default:
        return rawTab;
    }
  };

  const handleSwitchTab = (tab: string) => {
    const normalized = normalizeTab(tab);
    setActiveTab(normalized);
    localStorage.setItem(TAB_KEY, normalized);
  };

  // If user is not logged in, render the login page
  if (!currentUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLogin}
          dataSource={dataSource}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <GasSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentSource={dataSource}
        />
        <ConfirmModal modal={modalState} onClose={handleCloseModal} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 selection:bg-indigo-600 selection:text-white pb-16 sm:pb-6">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-1.5 shadow-sm">
          <WifiOff className="w-4 h-4" />
          <span>Anda sedang dalam mode offline. Data disimpan secara lokal di perangkat.</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        user={currentUser}
        dataSource={dataSource}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenParentPortal={() => setIsParentPinModalOpen(true)}
      />

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {/* If Student is currently taking an exam */}
        {activeExam ? (
          <CBTExamActive
            exam={activeExam}
            currentUser={currentUser}
            onFinishExam={() => setActiveExam(null)}
            onViewImage={(url, title) => setPreviewImage({ url, title })}
            onShowModal={handleShowModal}
          />
        ) : (
          <div className="space-y-6">
            {/* ============================================================== */}
            {/* ROLE: ADMIN WITH FULL ACCESS TO ALL MENUS (REQUIREMENT 1)     */}
            {/* ============================================================== */}
            {currentUser.role === 'admin' && (
              <div className="space-y-6">
                {/* Categorized Admin Navigation Bar */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-black text-xs">
                        SUPER ADMIN
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Pusat Akses Penuh Sistem
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Semua modul Guru & Murid dapat diakses langsung oleh Administrator
                    </span>
                  </div>

                  {/* Top Level Nav Categories */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {/* Admin Core Group */}
                    <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <button
                        onClick={() => handleSwitchTab('admin_dashboard')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          activeTab === 'admin_dashboard'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => handleSwitchTab('admin_users')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          activeTab === 'admin_users'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Pengguna</span>
                      </button>

                      <button
                        onClick={() => handleSwitchTab('admin_master')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          activeTab === 'admin_master'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>Data Master</span>
                      </button>

                      <button
                        onClick={() => handleSwitchTab('admin_settings')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          activeTab === 'admin_settings'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <School className="w-3.5 h-3.5" />
                        <span>Sekolah & Keamanan</span>
                      </button>

                      <button
                        onClick={() => handleSwitchTab('admin_announcements')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                          activeTab === 'admin_announcements'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Pengumuman</span>
                        {announcements.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            {announcements.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Guru Core Group Access */}
                    <div className="flex flex-wrap items-center gap-1 bg-amber-50/60 p-1.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-black uppercase text-amber-900 px-1.5">
                        Akses Guru:
                      </span>
                      <button
                        onClick={() => handleSwitchTab('guru_materi')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                          activeTab === 'guru_materi'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Materi</span>
                      </button>
                      <button
                        onClick={() => handleSwitchTab('guru_cbt')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                          activeTab === 'guru_cbt'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ujian CBT</span>
                      </button>
                      <button
                        onClick={() => handleSwitchTab('guru_nilai')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                          activeTab === 'guru_nilai'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Rekap Nilai</span>
                      </button>
                    </div>

                    {/* Murid Core Group Access */}
                    <div className="flex flex-wrap items-center gap-1 bg-emerald-50/60 p-1.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-black uppercase text-emerald-900 px-1.5">
                        Akses Murid:
                      </span>
                      <button
                        onClick={() => handleSwitchTab('murid_materi')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                          activeTab === 'murid_materi'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ruang Belajar</span>
                      </button>
                      <button
                        onClick={() => handleSwitchTab('murid_cbt')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                          activeTab === 'murid_cbt'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Simulasi CBT</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Views for Admin */}
                {activeTab === 'admin_dashboard' && (
                  <AdminDashboard
                    currentUser={currentUser}
                    onNavigateTab={handleSwitchTab}
                    onShowModal={handleShowModal}
                  />
                )}

                {activeTab === 'admin_users' && (
                  <AdminView onShowModal={handleShowModal} />
                )}

                {activeTab === 'admin_master' && (
                  <AdminMasterData
                    currentUser={currentUser}
                    onShowModal={handleShowModal}
                  />
                )}

                {activeTab === 'admin_settings' && (
                  <AdminSchoolSettings onShowModal={handleShowModal} />
                )}

                {activeTab === 'admin_announcements' && (
                  <AnnouncementBoard
                    currentUser={currentUser}
                    onShowModal={handleShowModal}
                  />
                )}

                {/* Admin direct access to Guru modules */}
                {activeTab === 'guru_materi' && (
                  <GuruMateri
                    currentUser={currentUser}
                    onPlayYoutube={(id) => setYoutubeVideoId(id)}
                    onViewImage={(url, title) => setPreviewImage({ url, title })}
                    onShowModal={handleShowModal}
                  />
                )}

                {activeTab === 'guru_cbt' && (
                  <GuruCBT
                    onShowModal={handleShowModal}
                    onViewImage={(url, title) => setPreviewImage({ url, title })}
                  />
                )}

                {activeTab === 'guru_nilai' && (
                  <GuruNilai onShowModal={handleShowModal} />
                )}

                {/* Admin direct access to Murid modules */}
                {(activeTab === 'murid_materi' || activeTab === 'murid_cbt') && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2 text-emerald-900 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        <strong>Mode Akses Murid (Admin):</strong> Sedang menjalankan simulasi tampilan siswa SDN Harjosari Kidul 01.
                      </span>
                    </div>
                    <button
                      onClick={() => handleSwitchTab('admin_dashboard')}
                      className="text-xs px-3 py-1 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 transition"
                    >
                      ← Kembali ke Dashboard Admin
                    </button>
                  </div>
                )}

                {activeTab === 'murid_materi' && (
                  <MuridMateri
                    currentUser={{ ...currentUser, role: 'admin', kelas: currentUser.kelas || 'Semua' }}
                    onPlayYoutube={(id) => setYoutubeVideoId(id)}
                    onViewImage={(url, title) => setPreviewImage({ url, title })}
                  />
                )}

                {activeTab === 'murid_cbt' && (
                  <MuridCBTList
                    currentUser={{ ...currentUser, role: 'admin', kelas: currentUser.kelas || 'Semua' }}
                    onStartExam={(exam) => setActiveExam(exam)}
                    onOpenParentPortal={() => setIsParentPinModalOpen(true)}
                  />
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* ROLE: GURU                                                     */}
            {/* ============================================================== */}
            {currentUser.role === 'guru' && (
              <div className="space-y-6">
                {/* School Announcement Top Alert Banner (Guru) */}
                {activeTab !== 'pengumuman' && visibleAnnouncements.length > 0 && (
                  <AnnouncementAlertBanner
                    announcements={visibleAnnouncements}
                    onViewAll={() => handleSwitchTab('pengumuman')}
                    onOpenNotificationModal={() => setIsNotificationOpen(true)}
                  />
                )}

                {/* Guru Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-white px-2 rounded-2xl shadow-sm overflow-x-auto">
                  <button
                    onClick={() => handleSwitchTab('materi')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'materi'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Kelola Materi Belajar</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab('cbt')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'cbt'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Kelola Ujian & Soal CBT</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab('nilai')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'nilai'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Rekap Nilai & Anti-Contek</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab('pengumuman')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'pengumuman'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Papan Pengumuman</span>
                    {visibleAnnouncements.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                        {visibleAnnouncements.length}
                      </span>
                    )}
                  </button>
                </div>

                {activeTab === 'materi' && (
                  <GuruMateri
                    currentUser={currentUser}
                    onPlayYoutube={(id) => setYoutubeVideoId(id)}
                    onViewImage={(url, title) => setPreviewImage({ url, title })}
                    onShowModal={handleShowModal}
                  />
                )}

                {activeTab === 'cbt' && (
                  <GuruCBT
                    onShowModal={handleShowModal}
                    onViewImage={(url, title) => setPreviewImage({ url, title })}
                  />
                )}

                {activeTab === 'nilai' && (
                  <GuruNilai onShowModal={handleShowModal} />
                )}

                {activeTab === 'pengumuman' && (
                  <AnnouncementBoard
                    currentUser={currentUser}
                    onShowModal={handleShowModal}
                  />
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* ROLE: MURID                                                    */}
            {/* ============================================================== */}
            {currentUser.role === 'murid' && (
              <div className="space-y-6">
                {/* School Announcement Top Alert Banner (Murid) */}
                {activeTab !== 'pengumuman' && visibleAnnouncements.length > 0 && (
                  <AnnouncementAlertBanner
                    announcements={visibleAnnouncements}
                    onViewAll={() => handleSwitchTab('pengumuman')}
                    onOpenNotificationModal={() => setIsNotificationOpen(true)}
                  />
                )}

                {/* Murid Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-white px-2 rounded-2xl shadow-sm overflow-x-auto">
                  <button
                    onClick={() => handleSwitchTab('materi')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'materi'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Materi Belajar</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab('cbt')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'cbt'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Daftar Ujian CBT</span>
                  </button>
                  <button
                    onClick={() => handleSwitchTab('pengumuman')}
                    className={`py-3.5 px-5 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
                      activeTab === 'pengumuman'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-indigo-600'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Papan Pengumuman</span>
                    {visibleAnnouncements.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                        {visibleAnnouncements.length}
                      </span>
                    )}
                  </button>
                </div>

                {activeTab === 'materi' && (
                  <div className="space-y-6">
                    <MuridMateri
                      currentUser={currentUser}
                      onPlayYoutube={(id) => setYoutubeVideoId(id)}
                      onViewImage={(url, title) => setPreviewImage({ url, title })}
                    />
                    {visibleAnnouncements.length > 0 && (
                      <AnnouncementBoard
                        currentUser={currentUser}
                        compact={true}
                        onViewAll={() => handleSwitchTab('pengumuman')}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'cbt' && (
                  <div className="space-y-6">
                    <MuridCBTList
                      currentUser={currentUser}
                      onStartExam={(exam) => setActiveExam(exam)}
                      onOpenParentPortal={() => setIsParentPinModalOpen(true)}
                    />
                    {visibleAnnouncements.length > 0 && (
                      <AnnouncementBoard
                        currentUser={currentUser}
                        compact={true}
                        onViewAll={() => handleSwitchTab('pengumuman')}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'pengumuman' && (
                  <AnnouncementBoard
                    currentUser={currentUser}
                    onShowModal={handleShowModal}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Bottom Bar (Phones only) */}
      {!activeExam && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex justify-around items-center shadow-lg">
          {currentUser.role === 'murid' ? (
            <>
              <button
                onClick={() => handleSwitchTab('materi')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeTab === 'materi' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px]">Materi</span>
              </button>
              <button
                onClick={() => handleSwitchTab('cbt')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeTab === 'cbt' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-[10px]">Ujian CBT</span>
              </button>
              <button
                onClick={() => handleSwitchTab('pengumuman')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
                  activeTab === 'pengumuman' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Megaphone className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px]">Pengumuman</span>
              </button>
            </>
          ) : currentUser.role === 'guru' ? (
            <>
              <button
                onClick={() => handleSwitchTab('materi')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'materi' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px]">Materi</span>
              </button>
              <button
                onClick={() => handleSwitchTab('cbt')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'cbt' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px]">CBT</span>
              </button>
              <button
                onClick={() => handleSwitchTab('nilai')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'nilai' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="text-[10px]">Rekap</span>
              </button>
              <button
                onClick={() => handleSwitchTab('pengumuman')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition relative ${
                  activeTab === 'pengumuman' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <div className="relative">
                  <Megaphone className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px]">Pengumuman</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-around w-full">
              <button
                onClick={() => handleSwitchTab('admin_dashboard')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'admin_dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-[10px]">Dashboard</span>
              </button>
              <button
                onClick={() => handleSwitchTab('admin_users')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'admin_users' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-[10px]">Pengguna</span>
              </button>
              <button
                onClick={() => handleSwitchTab('admin_master')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'admin_master' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="text-[10px]">Master</span>
              </button>
              <button
                onClick={() => handleSwitchTab('admin_announcements')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'admin_announcements' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span className="text-[10px]">Pengumuman</span>
              </button>
              <button
                onClick={() => handleSwitchTab('admin_settings')}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  activeTab === 'admin_settings' ? 'text-indigo-600 font-bold' : 'text-slate-500'
                }`}
              >
                <School className="w-4 h-4" />
                <span className="text-[10px]">Sekolah</span>
              </button>
            </div>
          )}
        </nav>
      )}

      {/* Shared Modals */}
      <YouTubeModal videoId={youtubeVideoId} onClose={() => setYoutubeVideoId(null)} />

      <ImageModal
        imageUrl={previewImage?.url || null}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />

      <GasSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSource={dataSource}
      />

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false);
          refreshAnnouncements();
        }}
        currentUser={currentUser}
        onOpenFullBoard={() => {
          setIsNotificationOpen(false);
          if (currentUser.role === 'admin') {
            handleSwitchTab('admin_announcements');
          } else {
            handleSwitchTab('pengumuman');
          }
        }}
      />

      <ConfirmModal modal={modalState} onClose={handleCloseModal} />

      {/* Portal Orang Tua Modals (additive feature for student/admin accounts) */}
      {isParentPinModalOpen && currentUser && (
        <ParentPinModal
          isOpen={isParentPinModalOpen}
          onClose={() => setIsParentPinModalOpen(false)}
          student={currentUser}
          onSuccess={() => {
            setIsParentPinModalOpen(false);
            setIsParentDashboardOpen(true);
          }}
        />
      )}

      {isParentDashboardOpen && currentUser && (
        <ParentDashboardModal
          isOpen={isParentDashboardOpen}
          onClose={() => setIsParentDashboardOpen(false)}
          student={currentUser}
          onViewImage={(url, title) => setPreviewImage({ url, title })}
        />
      )}
    </div>
  );
}
