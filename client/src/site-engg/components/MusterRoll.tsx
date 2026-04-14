import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Download, Filter, 
  Users, CheckCircle, XCircle, Clock, AlertCircle, FileText 
} from 'lucide-react';
import { StorageService } from '../lib/storage';
import { checkInService } from '../services/checkInService';
import { leaveService } from '../services/leaveService';
import { exportToCSV } from '../lib/export';
import type { User, CheckIn, LeaveRequest, Assignment } from '../types';

interface MusterRollProps {
  clientId?: string;
  engineerIds?: string[];
}

export default function MusterRoll({ clientId, engineerIds }: MusterRollProps) {
  const [view, setView] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    engineers: User[];
    checkIns: CheckIn[];
    leaves: LeaveRequest[];
    assignments: Assignment[];
  }>({ engineers: [], checkIns: [], leaves: [], assignments: [] });

  useEffect(() => {
    loadMusterData();
  }, [selectedDate, view]);

  async function loadMusterData() {
    try {
      setLoading(true);
      const [allU, allCk, allL, allA] = await Promise.all([
        StorageService.getUsers(),
        checkInService.getAllCheckIns(),
        leaveService.getAllLeaveRequests(),
        StorageService.getAssignments()
      ]);

      let filteredEng = allU.filter(u => u.role === 'engineer');
      let filteredA = allA;

      if (clientId) {
        filteredA = allA.filter(a => a.clientId === clientId);
        const assignedIds = filteredA.map(a => a.engineerId);
        filteredEng = filteredEng.filter(e => assignedIds.includes(e.id));
      } else if (engineerIds) {
        filteredEng = filteredEng.filter(e => engineerIds.includes(e.id));
      }

      setData({ engineers: filteredEng, checkIns: allCk, leaves: allL, assignments: filteredA });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  
  const renderMonthlyMuster = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xl border border-slate-200">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="sticky left-0 bg-slate-100 z-10 p-3 text-left border-r min-w-[150px] font-black uppercase">Staff Name</th>
              {days.map(d => (
                <th key={d} className={`p-2 border-r text-center min-w-[40px] font-bold ${
                  new Date(year, month, d).getDay() === 0 ? 'bg-red-50 text-red-600' : ''
                }`}>
                  {d}
                </th>
              ))}
              <th className="p-3 bg-slate-100 font-black uppercase border-l text-center">T.P</th>
            </tr>
          </thead>
          <tbody>
            {data.engineers.map(eng => {
              let presentCount = 0;
              return (
                <tr key={eng.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="sticky left-0 bg-white z-10 p-3 font-bold border-r text-slate-700">{eng.name}</td>
                  {days.map(d => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const hasCheckIn = data.checkIns.find(c => c.engineerId === eng.id && c.date === dateStr);
                    const onLeave = data.leaves.find(l => {
                      const start = new Date(l.startDate);
                      const end = new Date(l.endDate);
                      const current = new Date(year, month, d);
                      return l.engineerId === eng.id && l.status === 'approved' && current >= start && current <= end;
                    });

                    let status = 'A';
                    let color = 'text-slate-300';
                    if (hasCheckIn) { 
                      status = 'P'; color = 'text-emerald-600 font-black'; presentCount++;
                    } else if (onLeave) { 
                       status = 'L'; color = 'text-orange-500 font-bold';
                    } else if (new Date(year, month, d).getDay() === 0) {
                       status = 'H'; color = 'text-red-300';
                    }

                    return (
                      <td key={d} className={`p-2 border-r text-center ${color}`}>
                        {status}
                      </td>
                    );
                  })}
                  <td className="p-3 font-black text-center bg-blue-50 text-blue-700 border-l">{presentCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDailyMuster = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Resource Presence</span>
           <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase tracking-tight">{data.engineers.length} Staff</span>
        </div>
        <div className="divide-y divide-slate-100">
          {data.engineers.map(eng => {
            const hasCheckIn = data.checkIns.find(c => c.engineerId === eng.id && c.date === dateStr);
            const onLeave = data.leaves.find(l => {
              const start = new Date(l.startDate + 'T00:00:00');
              const end = new Date(l.endDate + 'T23:59:59');
              const current = new Date(year, month, day, 12, 0, 0); 
              return l.engineerId === eng.id && l.status === 'approved' && current >= start && current <= end;
            });

            let status = 'Absent';
            let color = 'bg-slate-100 text-slate-400';
            if (hasCheckIn) { status = 'Present'; color = 'bg-emerald-100 text-emerald-700'; }
            else if (onLeave) { status = 'On Leave'; color = 'bg-orange-100 text-orange-600'; }
            else if (selectedDate.getDay() === 0) { status = 'Holiday'; color = 'bg-red-50 text-red-500'; }

            return (
              <div key={eng.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{eng.name.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-slate-800 uppercase text-xs">{eng.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{eng.email}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest ${color}`}>{status}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearlyMuster = () => {
    const year = selectedDate.getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xl border border-slate-200">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="sticky left-0 bg-slate-100 z-10 p-4 text-left border-r min-w-[150px] font-black uppercase">Staff Name</th>
              {months.map(m => <th key={m} className="p-3 border-r text-center min-w-[60px] font-black uppercase">{m}</th>)}
              <th className="p-4 bg-slate-100 font-black uppercase border-l text-center">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {data.engineers.map(eng => {
              let yearlyTotal = 0;
              return (
                <tr key={eng.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="sticky left-0 bg-white z-10 p-4 font-bold border-r text-slate-700">{eng.name}</td>
                  {months.map((m, monthIdx) => {
                    const monthPresent = data.checkIns.filter(c => 
                      c.engineerId === eng.id && 
                      new Date(c.date).getFullYear() === year && 
                      new Date(c.date).getMonth() === monthIdx
                    ).length;
                    yearlyTotal += monthPresent;
                    return <td key={m} className="p-3 border-r text-center font-bold text-slate-600">{monthPresent}</td>;
                  })}
                  <td className="p-4 font-black text-center bg-blue-50 text-blue-700 border-l">{yearlyTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const changeDate = (offset: number) => {
    const newDate = new Date(selectedDate);
    if (view === 'monthly') newDate.setMonth(newDate.getMonth() + offset);
    else if (view === 'yearly') newDate.setFullYear(newDate.getFullYear() + offset);
    else newDate.setDate(newDate.getDate() + offset);
    setSelectedDate(newDate);
  };

  const exportMuster = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    const exportData = data.engineers.map(eng => {
      const row: any = { 'Engineer Name': eng.name };
      let total = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasCheckIn = data.checkIns.find(c => c.engineerId === eng.id && c.date === dateStr);
        row[`Day ${d}`] = hasCheckIn ? 'P' : 'A';
        if (hasCheckIn) total++;
      }
      row['Total Present'] = total;
      return row;
    });
    exportToCSV(exportData, `muster-roll-${year}-${month + 1}`);
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse font-black uppercase">Formatting Muster Roll...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500 rounded-3xl shadow-lg shadow-emerald-500/30 font-black"><Calendar className="w-8 h-8" /></div>
            <div>
               <h2 className="text-2xl font-black uppercase tracking-tight">Muster Roll</h2>
               <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Personnel Presence Tracker</p>
            </div>
         </div>
         <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10">
            {['daily', 'monthly', 'yearly'].map((v:any) => (
              <button key={v} onClick={()=>setView(v)} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${view === v ? 'bg-white text-slate-900 shadow-xl' : 'text-white hover:bg-white/5'}`}>{v}</button>
            ))}
         </div>
      </div>

      <div className="flex items-center justify-between px-2">
         <div className="flex items-center gap-3">
            <button onClick={()=>changeDate(-1)} className="p-3 bg-white border rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 active:scale-90 transition-all"><ChevronLeft className="w-6 h-6" /></button>
            <div className="text-center">
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">
                  {view === 'monthly' ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                   view === 'yearly' ? selectedDate.getFullYear() :
                   selectedDate.toLocaleDateString()}
               </h3>
               <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Active Schedule</p>
            </div>
            <button onClick={()=>changeDate(1)} className="p-3 bg-white border rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 active:scale-90 transition-all"><ChevronRight className="w-6 h-6" /></button>
         </div>
         <button onClick={exportMuster} className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"><Download className="w-5 h-5"/> Export Roll</button>
      </div>

      {view === 'yearly' ? renderYearlyMuster() : view === 'monthly' ? renderMonthlyMuster() : renderDailyMuster()}

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 flex flex-wrap gap-6 items-center justify-center">
         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full" /> <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Present (P)</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-300 rounded-full" /> <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Absent (A)</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-400 rounded-full" /> <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Leave (L)</span></div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-100 rounded-full" /> <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Holiday (H)</span></div>
      </div>
    </div>
  );
}
