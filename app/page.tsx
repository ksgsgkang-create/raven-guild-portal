'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import AuthForm from '../components/AuthForm';
import RaidScanner from '../components/RaidScanner';
import MemberManager from '../components/MemberManager';
import GuildAdminManager from '../components/GuildAdminManager';
import NoticeBoardList from '../components/NoticeBoardList';
import StatsDashboard from '../components/StatsDashboard';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'raid' | 'members' | 'admin' | 'stats'>('stats');
  const [loading, setLoading] = useState(true);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) setCurrentUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  async function fetchData() {
    const { data: g } = await supabase.from('alliance_guilds').select('*');
    const { data: m } = await supabase.from('members').select('*');
    const { data: u } = await supabase.from('user_accounts').select('*');
    if (g) setGuilds(g);
    if (m) setMembers(m);
    if (u) setAllUsers(u);
  }

  useEffect(() => { if (currentUser) fetchData(); }, [currentUser]);

  if (loading) return <div>로딩중...</div>;
  if (!currentUser) return <AuthForm onLoginSuccess={setCurrentUser} />;

  // 탭 구성 (관리자 권한 확인)
  const tabs = [
    { id: 'stats', label: '참여 통계' },
    { id: 'members', label: '인원 관리' },
    ...(currentUser.is_admin ? [
      { id: 'raid', label: '보스 스캔' },
      { id: 'admin', label: '승인/공지' }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 selection:bg-sky-500">
      <nav className="flex items-center gap-8 mb-10 border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-black text-amber-500">전국구 포탈</h1>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} 
              className={`px-6 py-2 rounded-full transition-all ${activeTab === t.id ? 'bg-sky-600 text-white' : 'hover:bg-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => { localStorage.removeItem('currentUser'); setCurrentUser(null); }} className="ml-auto text-xs bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-700">로그아웃</button>
      </nav>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {activeTab === 'raid' && currentUser.is_admin && <RaidScanner members={members} onRefresh={fetchData} />}
          {activeTab === 'members' && <MemberManager members={members} guilds={guilds} currentUser={currentUser} onRefresh={fetchData} />}
          {activeTab === 'admin' && currentUser.is_admin && <GuildAdminManager guilds={guilds} allUsers={allUsers} isAdmin={currentUser.is_admin} onRefresh={fetchData} />}
          {activeTab === 'stats' && <StatsDashboard />}
        </div>
        <aside className="lg:col-span-1"><NoticeBoardList /></aside>
      </main>
    </div>
  );
}