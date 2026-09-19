import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Award,
  Users,
  Settings,
  AlertCircle,
  WifiOff,
  GraduationCap,
} from 'lucide-react';
import { User, Ujian } from './types';
import { api, DataSource, subscribeDataSource, normalizeUser } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { AdminView } from './components/AdminView';
import { GuruMateri } from './components/GuruView/GuruMateri';
import { GuruCBT } from './components/GuruView/GuruCBT';
import { GuruNilai } from './components/GuruView/GuruNilai';
import { MuridMateri } from './components/MuridView/MuridMateri';
import { MuridCBTList } from './components/MuridView/MuridCBTList';
import { CBTExamActive } from './components/MuridView/CBTExamActive';
import { YouTubeModal } from './components/YouTubeModal';
import { ImageModal } from './components/ImageModal';
import { ConfirmModal, ModalState } from './components/ConfirmModal';
import { GasSettingsModal } from './components/GasSettingsModal';

const SESSION_KEY = 'elearning_user_session';
const TAB_KEY = 'elearning_active_tab';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('materi');
  const [activeExam, setActiveExam] = useState<Ujian | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('LOCAL');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Modals state
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Check connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeDataSource((src) => setDataSource(src));

    // Restore saved session
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setCurrentUser(normalizeUser(parsed));
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    const savedTab = localStorage.getItem(TAB_KEY);
    if (savedTab) {
      setActiveTab(savedTab);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const handleLogin = (user: User) => {
    const cleanUser = normalizeUser(user);
    setCurrentUser(cleanUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(cleanUser));
    if (cleanUser.role === 'admin') {
      setActiveTab('users');
    } else {
      setActiveTab('materi');
    }
  };

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

  const handleSwitchTab = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY, tab);
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
            {/* ROLE: ADMIN */}
            {currentUser.role === 'admin' && (
              <AdminView
                onShowModal={handleShowModal}
              />
            )}

            {/* ROLE: GURU */}
            {currentUser.role === 'guru' && (
              <div className="space-y-6">
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
                  <GuruNilai
                    onShowModal={handleShowModal}
                  />
                )}
              </div>
            )}

            {/* ROLE: MURID */}
            {currentUser.role === 'murid' && (
              <div className="space-y-6">
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
                </div>

                {activeTab === 'materi' && (
                  <MuridMateri
                    currentUser={currentUser}
                    onPlayYoutube={(id) => setYoutubeVideoId(id)}
                    onViewImage={(url, title) => setPreviewImage({ url, title })}
                  />
                )}

                {activeTab === 'cbt' && (
                  <MuridCBTList
                    currentUser={currentUser}
                    onStartExam={(exam) => setActiveExam(exam)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Floating Bottom Bar for Murid & Guru (Phones only) */}
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
            </>
          ) : (
            <div className="text-xs font-semibold text-slate-500 py-1">
              Administrator SDN Harjosari Kidul 01
            </div>
          )}
        </nav>
      )}

      {/* Shared Modals */}
      <YouTubeModal
        videoId={youtubeVideoId}
        onClose={() => setYoutubeVideoId(null)}
      />

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

      <ConfirmModal
        modal={modalState}
        onClose={handleCloseModal}
      />
    </div>
  );
}
