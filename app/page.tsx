'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { motion, AnimatePresence } from 'framer-motion';
import AuthForm from '../components/AuthForm';
import RaidScanner from '../components/RaidScanner';
import MemberManager from '../components/MemberManager';
import GuildAdminManager from '../components/GuildAdminManager';
import NoticeBoardList from '../components/NoticeBoardList';
import ActivityRanking from '../components/ActivityRanking';
import FreeBoard from '../components/FreeBoard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ranking' | 'freeboard' | 'raid' | 'members' | 'admin'>('ranking');
  const [loading, setLoading] = useState(true);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);

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

  const tabs = [
    { id: 'ranking', label: '활동 랭킹' },
    { id: 'freeboard', label: '자유 게시판' },
    { id: 'members', label: '인원 관리' },
    ...(currentUser.is_admin ? [
      { id: 'raid', label: '보스 스캔' },
      { id: 'admin', label: '승인/공지' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 selection:bg-sky-500">
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row items-center gap-6 mb-10 border-b border-slate-800 pb-6"
      >
        <h1 className="text-3xl font-black text-amber-500 tracking-tighter">전국구</h1>
        <div className="flex flex-wrap gap-2 justify-center">
          {tabs.map((t) => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)} 
              className={`px-5 py-2 rounded-full transition-all duration-300 cursor-pointer font-bold ${
                activeTab === t.id ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/50 scale-105' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
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
              {activeTab === 'ranking' && <ActivityRanking members={members} />}
              {activeTab === 'freeboard' && <FreeBoard currentUser={currentUser} />}
              {activeTab === 'raid' && currentUser.is_admin && <RaidScanner members={members} onRefresh={fetchData} />}
              {activeTab === 'members' && <MemberManager members={members} guilds={guilds} currentUser={currentUser} onRefresh={fetchData} />}
              {activeTab === 'admin' && currentUser.is_admin && <GuildAdminManager guilds={guilds} allUsers={allUsers} isAdmin={currentUser.is_admin} onRefresh={fetchData} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <aside className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <NoticeBoardList notices={notices} />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl"
          >
            <h3 className="font-bold text-sky-400 mb-2 flex items-center gap-2">⚡ 오늘의 길드 현황</h3>
            <div className="text-3xl font-black text-white">{members.length}<span className="text-sm font-normal text-slate-400 ml-1">명 활동 중</span></div>
          </motion.div>
        </aside>
      </main>
    </div>
  );
}