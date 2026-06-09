'use client';
import React, { useState } from 'react';
import { supabase } from '../app/supabase';

export default function AuthForm({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [characterName, setCharacterName] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLogin) {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('character_name', characterName)
        .eq('password', password)
        .maybeSingle();

      if (error || !data) return alert('로그인 실패: 캐릭터명이나 비밀번호를 확인하세요.');
      if (!data.is_approved) return alert('관리자의 승인을 기다려주세요.');
      
      localStorage.setItem('currentUser', JSON.stringify(data));
      onLoginSuccess(data);
    } else {
      const { error } = await supabase
        .from('user_accounts')
        .insert([{ character_name: characterName, password, is_approved: false, is_admin: false }]);

      if (error) return alert('가입 신청 실패: ' + error.message);
      alert('가입 신청이 완료되었습니다.');
      setIsLogin(true);
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-slate-950">
      <form onSubmit={handleSubmit} className="bg-slate-900 p-8 rounded-2xl border border-slate-700 w-80 shadow-2xl flex flex-col items-center">
        
        {/* 로고 및 전국구 명칭 가로 배치 (테두리 제거 및 텍스트 확대) */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img 
            src="/logo.PNG" 
            alt="RAVEN II" 
            className="h-10 w-auto object-contain" 
          />
          <span className="text-lg font-black tracking-widest text-amber-500">
            전국구
          </span>
        </div>

        <h2 className="text-xl font-bold text-sky-400 mb-6 text-center">
          {isLogin ? '로그인' : '가입 신청'}
        </h2>

        <input 
          type="text" 
          placeholder="캐릭터명" 
          value={characterName} 
          onChange={(e) => setCharacterName(e.target.value)} 
          className="w-full bg-slate-800 p-3 rounded-xl mb-4 border border-slate-700 text-white focus:border-sky-500 outline-none" 
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="w-full bg-slate-800 p-3 rounded-xl mb-6 border border-slate-700 text-white focus:border-sky-500 outline-none" 
        />
        <button className="w-full bg-sky-600 py-3 rounded-xl font-bold hover:bg-sky-500 transition-all cursor-pointer">
          {isLogin ? '로그인' : '신청하기'}
        </button>
        <p onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-400 mt-4 text-center cursor-pointer hover:text-white transition-colors">
          {isLogin ? '계정이 없으신가요? 가입 신청' : '이미 계정이 있나요? 로그인'}
        </p>
      </form>
    </div>
  );
}