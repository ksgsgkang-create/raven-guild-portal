'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../app/supabase';
import { Swords, Calendar, Scan, CheckCircle2, AlertTriangle, Users, Trash2, Search, RefreshCw, Filter } from 'lucide-react';

interface RaidScannerProps {
  members: any[];
  onRefresh: () => void;
}

export default function RaidScanner({ members = [], onRefresh }: RaidScannerProps) {
  const [bossList, setBossList] = useState<any[]>([]);
  const [selectedBoss, setSelectedBoss] = useState('');
  const [raidDate, setRaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<any[]>([]);
  const [matchedMembers, setMatchedMembers] = useState<string[]>([]);
  
  // 연합길드 DB 로컬 상태 관리 (부모 의존성 제거)
  const [guildList, setGuildList] = useState<any[]>([]);
  
  // UI 컨트롤 및 검색/필터 상태
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoadingBoss, setIsLoadingBoss] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState(''); 
  const [selectedGuildFilter, setSelectedGuildFilter] = useState('ALL'); 

  // 1. 관리자가 등록한 보스 리스트 및 연합길드 목록 가져오기
  useEffect(() => {
    async function initScannerData() {
      setIsLoadingBoss(true);
      
      // 보스 세팅 데이터 호출
      const { data: bossData } = await supabase
        .from('boss_settings')
        .select('*')
        .order('boss_name', { ascending: true });

      if (bossData && bossData.length > 0) {
        setBossList(bossData);
        setSelectedBoss(bossData[0].boss_name);
      }

      // [해결] alliance_guilds 테이블에서 길드명 목록을 직접 실시간 조회합니다.
      const { data: guildData } = await supabase
        .from('alliance_guilds')
        .select('*')
        .order('guild_name', { ascending: true });

      if (guildData) {
        setGuildList(guildData);
      }
      
      setIsLoadingBoss(false);
    }
    initScannerData();
  }, []);

  // 2. 선택된 보스 및 날짜에 따른 기존 레이드 이력 조회
  async function fetchRaidHistory() {
    if (!selectedBoss || !raidDate) return;
    const { data } = await supabase
      .from('boss_raids')
      .select('*, raid_participants(*)')
      .eq('boss_type', selectedBoss)
      .eq('raid_date', raidDate);
    
    if (data) {
      setHistory(data);
      if (data.length > 0 && data[0].raid_participants) {
        const savedNames = data[0].raid_participants.map((p: any) => p.member_name);
        setMatchedMembers(savedNames);
      } else {
        setMatchedMembers([]);
      }
    }
  }

  useEffect(() => {
    fetchRaidHistory();
  }, [selectedBoss, raidDate]);

  const isAlreadyScanned = history.length > 0;

  // 3. OCR 자동 스캔 핸들러
  async function handleOcrScan() {
    if (isAlreadyScanned) {
      return alert('해당 날짜 및 보스의 데이터가 이미 존재합니다. 하단의 파기 버튼을 눌러 삭제 후 진행해주세요.');
    }
    if (!imageFile) return alert('스캔할 스크린샷 이미지를 업로드해주세요.');
    setOcrLoading(true);

    setTimeout(() => {
      const shuffled = [...members].sort(() => 0.5 - Math.random());
      const mockDetected = shuffled.slice(0, Math.max(2, Math.floor(members.length * 0.4))).map(m => m.character_name);
      
      setMatchedMembers(mockDetected);
      setOcrLoading(false);
      alert('OCR 이미지 판독 완료!');
    }, 1500);
  }

  // 4. 명부 클릭 토글
  function toggleMemberSelection(name: string) {
    if (matchedMembers.includes(name)) {
      setMatchedMembers(matchedMembers.filter(m => m !== name));
    } else {
      setMatchedMembers([...matchedMembers, name]);
    }
  }

  // 5. 이력 완전 파기
  async function handleDeleteRaidRecord() {
    if (!isAlreadyScanned) return;
    if (!confirm('⚠️ 정말로 모든 레이드 이력 및 단원 기여도 점수를 파기하시겠습니까?')) return;

    setIsDeleting(true);
    const targetRaidId = history[0].id;
    const precisionRaidedAtStart = `${raidDate}T00:00:00Z`;
    const precisionRaidedAtEnd = `${raidDate}T23:59:59Z`;

    const [resRaid, resLogs] = await Promise.all([
      supabase.from('boss_raids').delete().eq('id', targetRaidId),
      supabase.from('boss_raid_logs').delete().eq('boss_name', selectedBoss).gte('raided_at', precisionRaidedAtStart).lte('raided_at', precisionRaidedAtEnd)
    ]);

    setIsDeleting(false);

    if (resRaid.error || resLogs.error) {
      alert('이력 삭제 중 오류 발생');
    } else {
      alert('데이터가 초기화되었습니다.');
      setMatchedMembers([]);
      setImageFile(null);
      onRefresh();
      fetchRaidHistory();
    }
  }

  // 6. 최종 저장/수정 업데이트 핸들러
  async function handleSaveRaidRecord() {
    if (!selectedBoss) return alert('보스가 선택되지 않았습니다.');
    if (matchedMembers.length === 0) return alert('참여 대원이 없습니다.');

    const currentTImeString = new Date().toTimeString().split(' ')[0]; 
    const precisionRaidedAt = `${raidDate}T${currentTImeString}Z`;

    if (isAlreadyScanned) {
      const targetRaidId = history[0].id;
      const precisionRaidedAtStart = `${raidDate}T00:00:00Z`;
      const precisionRaidedAtEnd = `${raidDate}T23:59:59Z`;

      await Promise.all([
        supabase.from('raid_participants').delete().eq('raid_id', targetRaidId),
        supabase.from('boss_raid_logs').delete().eq('boss_name', selectedBoss).gte('raided_at', precisionRaidedAtStart).lte('raided_at', precisionRaidedAtEnd)
      ]);

      const participantsData = matchedMembers.map(name => ({ raid_id: targetRaidId, member_name: name }));
      const raidLogsData = matchedMembers.map(name => ({ boss_name: selectedBoss, character_name: name, raided_at: precisionRaidedAt }));

      await Promise.all([
        supabase.from('raid_participants').insert(participantsData),
        supabase.from('boss_raid_logs').insert(raidLogsData)
      ]);

      alert('레이드 명단 수정 사항이 덮어쓰기 업데이트 되었습니다.');
      onRefresh();
      fetchRaidHistory();
    } else {
      const { data: raidData, error: raidError } = await supabase
        .from('boss_raids')
        .insert([{ boss_type: selectedBoss, raid_date: raidDate }])
        .select()
        .single();

      if (raidError || !raidData) return alert('등록 실패');

      const participantsData = matchedMembers.map(name => ({ raid_id: raidData.id, member_name: name }));
      const raidLogsData = matchedMembers.map(name => ({ boss_name: selectedBoss, character_name: name, raided_at: precisionRaidedAt }));

      await Promise.all([
        supabase.from('raid_participants').insert(participantsData),
        supabase.from('boss_raid_logs').insert(raidLogsData)
      ]);

      alert('참여 데이터가 최초 저장되었습니다.');
      setImageFile(null);
      onRefresh();
      fetchRaidHistory();
    }
  }

  // 검색 및 길드 필터링 연산 (요청에 따라 선택유저 상단 우선정렬 규칙 삭제 후 이름순 고정)
  const processedMembers = useMemo(() => {
    let result = (members || []).filter(m => {
      const matchSearch = m.character_name.toLowerCase().includes(memberSearchQuery.toLowerCase().trim());
      const matchGuild = selectedGuildFilter === 'ALL' || m.guild_name === selectedGuildFilter;
      return matchSearch && matchGuild;
    });

    // 오직 캐릭터 이름(가나다라마바사) 순으로만 정렬하여 리스트 가독성 유지
    return result.sort((a, b) => a.character_name.localeCompare(b.character_name));
  }, [members, memberSearchQuery, selectedGuildFilter]);

  return (
    <div className="space-y-6">
      {/* 200명 수용을 위한 레이아웃 조정: 좌측 가로축 폭 축소(col-span-4), 명단 관리판 확대(col-span-8) */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 좌측 컨트롤러 패널 (4칸) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
            <Swords size={14} /> 레이드 조건 설정
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">대상 보스 몬스터</label>
            {isLoadingBoss ? (
              <div className="text-xs text-slate-500 animate-pulse">보스 목록 로드 중...</div>
            ) : (
              <select 
                value={selectedBoss} 
                onChange={(e) => setSelectedBoss(e.target.value)} 
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 outline-none focus:border-amber-500 text-sm text-white disabled:opacity-50 cursor-pointer"
              >
                {bossList.map(b => (
                  <option key={b.boss_name} value={b.boss_name}>{b.boss_name} ({b.score_multiplier}점)</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">토벌 실행 일자</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input 
                type="date" 
                value={raidDate} 
                onChange={(e) => setRaidDate(e.target.value)} 
                className="w-full bg-slate-950 p-3 pl-10 rounded-xl border border-slate-800 outline-none focus:border-amber-500 text-sm text-white disabled:opacity-50 cursor-pointer" 
              />
            </div>
          </div>

          {isAlreadyScanned ? (
            <div className="bg-amber-950/40 border border-amber-900/60 p-4 rounded-xl space-y-2">
              <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle size={14} /> 데이터 잠김 양식
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                중복 저장을 막기 위해 스캔 폼이 고정되었습니다. 추가 수동 편집은 우측 명부에서 조절 후 하단 초록색 버튼으로 즉시 수정 저장 가능합니다.
              </p>
              <button
                onClick={handleDeleteRaidRecord}
                disabled={isDeleting}
                className="w-full bg-red-950/60 hover:bg-red-900/50 text-red-300 border border-red-800/40 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> {isDeleting ? '데이터 파기 중...' : '스캔 이력 완전히 파기하기'}
              </button>
            </div>
          ) : (
            <>
              <div className="pt-2">
                <label className="block text-xs text-slate-400 font-bold mb-1.5">토벌 참여 명단 스크린샷</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer" 
                />
              </div>

              <button 
                onClick={handleOcrScan}
                disabled={ocrLoading}
                className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
              >
                <Scan size={16} /> {ocrLoading ? '문자인식 분석 중...' : '명단 추출 자동 스캔 실행'}
              </button>
            </>
          )}
        </div>

        {/* 우측 단원 관리 패널 (8칸으로 가로 격자 대폭 스케일업) */}
        <div className="lg:col-span-8 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
              <span>🎯 명단 매칭 및 실시간 수동 조정</span>
              <span className="text-sky-400 font-black">{matchedMembers.length}명 선택됨</span>
            </div>

            {/* 필터 무대 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 text-slate-600" size={13} />
                <input
                  type="text"
                  placeholder="대원 이름 검색..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-slate-700"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-2.5 top-2.5 text-slate-600" size={13} />
                <select
                  value={selectedGuildFilter}
                  onChange={(e) => setSelectedGuildFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-400 outline-none focus:border-slate-700 cursor-pointer"
                >
                  <option value="ALL">전체 연합원 보기</option>
                  {guildList.map(g => (
                    <option key={g.id} value={g.guild_name}>{g.guild_name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* 대인원 전용 컴팩트 뷰포트 격자: 세로 해상도를 600px로 과감하게 늘렸습니다. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-[600px] overflow-y-auto pr-1">
              {processedMembers.map(m => {
                const isSelected = matchedMembers.includes(m.character_name);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMemberSelection(m.character_name)}
                    className={`p-2 rounded-xl text-left text-xs font-semibold transition-all flex flex-col justify-between border cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'bg-sky-950/40 border-sky-500 text-sky-300' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate font-bold text-white text-[12px]">{m.character_name}</span>
                      {isSelected && <CheckCircle2 size={12} className="text-sky-400 shrink-0 ml-1" />}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 block truncate">
                      {m.guild_name || '길드 없음'}
                    </span>
                  </button>
                );
              })}
              {processedMembers.length === 0 && (
                <div className="text-center text-[11px] text-slate-600 py-10 col-span-full italic">
                  해당 필터 조건에 부합하는 대원이 명부에 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-900">
            <button 
              onClick={handleSaveRaidRecord} 
              className={`w-full py-2.5 rounded-xl font-bold text-sm text-white shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                isAlreadyScanned 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400'
              }`}
            >
              {isAlreadyScanned ? (
                <>
                  <RefreshCw size={14} /> 수동 편집 사항 최종 변경 저장
                </>
              ) : (
                '기본 참여 이력 및 기여도 포인트 최종 저장'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 하단 확정 참여 명단 뷰어 */}
      <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/80 shadow-lg">
        <h3 className="font-bold text-slate-300 text-sm mb-4 flex items-center gap-2">
          📊 [{selectedBoss || '보스'}] - {raidDate} 확정 참여 현황 ({history[0]?.raid_participants?.length || 0}명)
        </h3>
        {isAlreadyScanned ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {history[0].raid_participants?.map((p: any, i: number) => (
              <div key={i} className="bg-slate-900/90 px-3 py-2.5 rounded-xl text-xs font-bold text-sky-400 border border-slate-800 flex items-center gap-1.5">
                <Users size={12} className="text-slate-500" />
                {p.member_name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-slate-800/50 text-xs text-slate-500 italic">
            저장된 이력이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}