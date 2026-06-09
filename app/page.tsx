'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Users, Swords, Settings, Megaphone, UserCog } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import RaidScanner from '../components/RaidScanner';
import MemberManager from '../components/MemberManager'; 
import MemberStatus from '../components/MemberStatus';   
import GuildAdminManager from '../components/GuildAdminManager';
import NoticeBoardList from '../components/NoticeBoardList';
import ActivityRanking from '../components/ActivityRanking';
import FreeBoard from '../components/FreeBoard';
import AccountManager from '../components/AccountManager';
import GuildManager from '../components/GuildManager'; 
import BossManager from '../components/BossManager'; 

export default function Page() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'ranking' | 'freeboard' | 'members' | 'admin-console'>('members');
  
  const [adminSubTab, setAdminSubTab] = useState<'members-admin' | 'admin' | 'raid' | 'boss-settings' | 'guilds' | 'account'>('members-admin');

  const [loading, setLoading] = useState(true);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setCurrentUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  async function fetchData() {
    const { data: g } = await supabase.from('alliance_guilds').select('*');
    const { data: m } = await supabase.from('members').select('*');
    const { data: u } = await supabase.from('user_accounts').select('*');
    const { data: n } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (g) setGuilds(g); if (m) setMembers(m); if (u) setAllUsers(u); if (n) setNotices(n);
  }

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser]);

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-950 text-white">로딩 중...</div>;
  if (!currentUser) return <AuthForm onLoginSuccess={setCurrentUser} />;

  const mainTabs = [
    { id: 'ranking', label: '활동 랭킹' },
    { id: 'freeboard', label: '자유 게시판' },
    { id: 'members', label: '인원 현황' },
    ...(currentUser.is_admin ? [{ id: 'admin-console', label: '⚙️ 관리자 콘솔' }] : [])
  ];

  const adminConsoleMenus = [
    { id: 'members-admin', label: '인원 관리(등록/편집)', icon: <UserCog size={18} /> },
    { id: 'admin', label: '승인 및 공지사항', icon: <Megaphone size={18} /> },
    { id: 'raid', label: '실시간 보스 스캔', icon: <Swords size={18} /> },
    { id: 'boss-settings', label: '대상 보스/배점 설정', icon: <Settings size={18} /> },
    { id: 'guilds', label: '연합 소속 길드 관리', icon: <Shield size={18} /> },
    { id: 'account', label: '전체 계정 관리', icon: <Key size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 relative overflow-x-hidden selection:bg-red-500/30">
      
      {/* 토스트 알림 (레드 테마) */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className={`fixed top-6 right-6 px-6 py-4 rounded-2xl text-white font-bold shadow-2xl z-50 border backdrop-blur-xl flex items-center gap-3 ${
              toast.type === 'error' 
                ? 'bg-red-950/90 border-red-500/50 text-red-100 shadow-red-900/40' 
                : 'bg-slate-900/90 border-red-500/40 text-red-100 shadow-red-900/20'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* [리뉴얼] 헤더 네비게이션: 강렬한 레드 그라데이션 및 역동적인 애니메이션 */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="relative flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-red-900/30 pb-8 px-10 bg-gradient-to-b from-slate-900/80 to-transparent backdrop-blur-2xl rounded-[40px] py-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <motion.div 
          className="flex items-center gap-4 group cursor-pointer"
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <div className="relative">
            <motion.div 
              className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <img 
              src="/logo.PNG" 
              alt="RAVEN II" 
              className="relative h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" 
            />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[48px] font-black tracking-tighter leading-none bg-gradient-to-br from-red-200 via-red-500 to-red-900 bg-clip-text text-transparent drop-shadow-[0_5px_15px_rgba(220,38,38,0.4)]">
              전국구
            </span>
            <div className="h-1 w-full bg-gradient-to-r from-red-600 to-transparent rounded-full mt-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-3 justify-center bg-slate-950/80 p-2.5 rounded-[24px] border border-red-900/20 shadow-inner">
          {mainTabs.map((t, idx) => (
            <motion.button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ 
                scale: 1.08, 
                y: -2,
                boxShadow: "0 10px 20px rgba(185, 28, 28, 0.3)" 
              }}
              whileTap={{ scale: 0.94 }}
              className={`px-8 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer font-black text-[15px] tracking-tight relative overflow-hidden group ${
                activeTab === t.id 
                  ? t.id === 'admin-console' 
                    ? 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-red-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)]'
                    : 'bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white shadow-[0_0_25px_rgba(220,38,38,0.4)]' 
                  : 'bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-red-100 hover:border-red-900/50'
              }`}
            >
              {t.label}
              {activeTab === t.id && (
                <motion.div 
                  className="absolute inset-0 bg-white/20"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ skewX: -20 }}
                />
              )}
            </motion.button>
          ))}
        </div>
        
        <motion.button 
          whileHover={{ 
            scale: 1.05, 
            backgroundColor: "rgba(153, 27, 27, 0.6)",
            borderColor: "rgba(239, 68, 68, 0.5)",
            boxShadow: "0 0 15px rgba(220, 38, 38, 0.3)"
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { localStorage.removeItem('currentUser'); setCurrentUser(null); }} 
          className="text-xs bg-slate-900 border border-slate-800 px-6 py-3.5 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-white font-black uppercase tracking-widest"
        >
          Logout
        </motion.button>
      </motion.nav>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-10 px-4">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            >
              {activeTab === 'ranking' && <ActivityRanking members={members} />}
              {activeTab === 'freeboard' && <FreeBoard currentUser={currentUser} showToast={showToast} />}
              {activeTab === 'members' && <MemberStatus members={members} guilds={guilds} />}
              
              {activeTab === 'admin-console' && currentUser.is_admin && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  <div className="bg-slate-900/40 p-4 rounded-[32px] border border-red-900/10 flex flex-wrap gap-3 shadow-2xl backdrop-blur-md">
                    {adminConsoleMenus.map((sub) => (
                      <motion.button
                        key={sub.id}
                        onClick={() => setAdminSubTab(sub.id as any)}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                          adminSubTab === sub.id
                            ? 'bg-red-600 text-white shadow-lg border-red-500 font-black'
                            : 'text-slate-400 hover:text-red-200 border-transparent hover:bg-slate-800'
                        }`}
                      >
                        {sub.icon}
                        {sub.label}
                      </motion.button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={adminSubTab}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        {adminSubTab === 'members-admin' && (
                          <MemberManager members={members} guilds={guilds} currentUser={currentUser} onRefresh={fetchData} showToast={showToast} />
                        )}
                        {adminSubTab === 'admin' && (
                          <GuildAdminManager allUsers={allUsers} isAdmin={currentUser.is_admin} onRefresh={fetchData} showToast={showToast} />
                        )}
                        {adminSubTab === 'raid' && (
                          <RaidScanner members={members} onRefresh={fetchData} />
                        )}
                        {adminSubTab === 'boss-settings' && (
                          <BossManager isAdmin={currentUser.is_admin} showToast={showToast} />
                        )}
                        {adminSubTab === 'guilds' && (
                          <GuildManager guilds={guilds} onRefresh={fetchData} showToast={showToast} />
                        )}
                        {adminSubTab === 'account' && (
                          <AccountManager allUsers={allUsers} onRefresh={fetchData} showToast={showToast} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <aside className="lg:col-span-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.3 }}
          >
            <NoticeBoardList notices={notices} currentUser={currentUser} onRefresh={fetchData} showToast={showToast} />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            whileHover={{ 
              scale: 1.03, 
              borderColor: "rgba(220, 38, 38, 0.5)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)" 
            }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-900 to-red-950/20 p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute -right-6 -bottom-6 opacity-5 text-red-500 group-hover:scale-110 transition-transform duration-700">
              <Users size={160} />
            </div>
            <h3 className="font-black text-red-500 mb-4 flex items-center gap-2 tracking-widest text-[11px] uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              Total Guild Members
            </h3>
            <div className="text-6xl font-black text-white tracking-tighter">
              {members.length}
              <span className="text-lg font-bold text-slate-500 ml-3">Online</span>
            </div>
          </motion.div>
        </aside>
      </main>
    </div>
  );
}