'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Users, Swords, Settings, Megaphone, UserCog } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import RaidScanner from '../components/RaidScanner';
import MemberManager from '../components/MemberManager'; // 등록/수정/삭제용 (관리자 콘솔로 이동)
import MemberStatus from '../components/MemberStatus';  // [신규] 일반 조회 및 상세 검색 전용
import GuildAdminManager from '../components/GuildAdminManager';
import NoticeBoardList from '../components/NoticeBoardList';
import ActivityRanking from '../components/ActivityRanking';
import FreeBoard from '../components/FreeBoard';
import AccountManager from '../components/AccountManager';
import GuildManager from '../components/GuildManager'; 
import BossManager from '../components/BossManager'; 

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // '인원 현황' (조회 전용) 탭이 기본 활성화되도록 설정
  const [activeTab, setActiveTab] = useState<'ranking' | 'freeboard' | 'members' | 'admin-console'>('members');
  
  // 관리자 콘솔 내부 서브 탭 (인원 관리가 첫 번째로 오도록 세팅)
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

  // 상단 메인 메뉴 정의
  const mainTabs = [
    { id: 'ranking', label: '활동 랭킹' },
    { id: 'freeboard', label: '자유 게시판' },
    { id: 'members', label: '인원 현황' },
    ...(currentUser.is_admin ? [{ id: 'admin-console', label: '⚙️ 관리자 콘솔' }] : [])
  ];

  // 관리자 내부 서브 메뉴 (인원 관리 추가)
  const adminConsoleMenus = [
    { id: 'members-admin', label: '인원 관리(등록/편집)', icon: <UserCog size={16} /> },
    { id: 'admin', label: '승인 및 공지사항', icon: <Megaphone size={16} /> },
    { id: 'raid', label: '실시간 보스 스캔', icon: <Swords size={16} /> },
    { id: 'boss-settings', label: '대상 보스/배점 설정', icon: <Settings size={16} /> },
    { id: 'guilds', label: '연합 소속 길드 관리', icon: <Shield size={16} /> },
    { id: 'account', label: '전체 계정 관리', icon: <Key size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 selection:bg-sky-500 relative">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-6 right-6 px-6 py-3 rounded-2xl text-white font-bold shadow-2xl z-50 border flex items-center gap-3 ${
              toast.type === 'error' 
                ? 'bg-red-900/80 border-red-500/30 text-red-100' 
                : 'bg-slate-900/95 border-sky-500/40 text-sky-200 shadow-sky-900/20'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-sky-400 animate-pulse'}`} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 네비게이션 */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row items-center gap-6 mb-10 border-b border-slate-800 pb-6"
      >
        <h1 className="text-3xl font-black text-amber-500 tracking-tighter">전국구</h1>
        <div className="flex flex-wrap gap-2 justify-center">
          {mainTabs.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`px-5 py-2 rounded-full transition-all duration-300 cursor-pointer font-bold ${
                activeTab === t.id 
                  ? t.id === 'admin-console' 
                    ? 'bg-purple-700 text-white shadow-lg shadow-purple-900/50 scale-105'
                    : 'bg-sky-600 text-white shadow-lg shadow-sky-900/50 scale-105' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { localStorage.removeItem('currentUser'); setCurrentUser(null); }} 
          className="md:ml-auto text-xs bg-slate-800 px-4 py-2 rounded-full hover:bg-red-900 transition-colors cursor-pointer"
        >
          로그아웃
        </button>
      </motion.nav>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 일반 대메뉴 컴포넌트 */}
              {activeTab === 'ranking' && <ActivityRanking members={members} />}
              {activeTab === 'freeboard' && <FreeBoard currentUser={currentUser} showToast={showToast} />}
              
              {/* [신규 변경점] 인원 현황 탭 진입 시 조회 및 상세검색 전용 컴포넌트 출력 */}
              {activeTab === 'members' && <MemberStatus members={members} guilds={guilds} />}
              
              {/* 관리자 콘솔 */}
              {activeTab === 'admin-console' && currentUser.is_admin && (
                <div className="space-y-6">
                  <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-1.5 shadow-xl">
                    {adminConsoleMenus.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setAdminSubTab(sub.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          adminSubTab === sub.id
                            ? 'bg-slate-800 text-white shadow-md border border-slate-700 scale-102'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40'
                        }`}
                      >
                        {sub.icon}
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={adminSubTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {/* 관리자 콘솔 내부 서브 탭 분기 */}
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
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* 사이드바 영역 */}
        <aside className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <NoticeBoardList notices={notices} currentUser={currentUser} onRefresh={fetchData} showToast={showToast} />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl"
          >
            <h3 className="font-bold text-sky-400 mb-2 flex items-center gap-2">⚡ 총 연합 길드원 수</h3>
            <div className="text-3xl font-black text-white">{members.length}<span className="text-sm font-normal text-slate-400 ml-1">명 활동 중</span></div>
          </motion.div>
        </aside>
      </main>
    </div>
  );
}