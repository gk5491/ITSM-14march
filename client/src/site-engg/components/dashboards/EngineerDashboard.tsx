import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, Calendar, Plus, Send, CheckCircle, AlertCircle,
  LogOut, Navigation, Briefcase, TrendingUp, MapPin, ArrowRight,
  Sparkles, Download, ChevronRight, BarChart3, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { leaveService } from '../../services/leaveService';
import { assignmentService } from '../../services/assignmentService';
import type { DailyReport, CheckIn, LeaveRequest, Assignment } from '../../types';

export default function EngineerDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'reports' | 'leave'>('attendance');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  const [reportForm, setReportForm] = useState({ clientId: '', siteId: '', workDone: '', issues: '' });
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    if (user?.id) {
      loadData();
      const timer = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const engId = (user as any)?.engineerId || user?.id;
      if (!engId) { setLoading(false); return; }
      const [reportsData, checkInsData, leavesData, assignmentsData, todayCheck] = await Promise.all([
        reportService.getReports(engId),
        checkInService.getAllCheckIns(engId),
        leaveService.getMyLeaveRequests(engId),
        assignmentService.getMyAssignments(engId),
        checkInService.getTodayCheckIn(engId)
      ]);
      setReports([...reportsData]);
      setCheckIns(checkInsData.filter((c: CheckIn) => c.engineerId === engId));
      setLeaves([...leavesData]);
      setAssignments(assignmentsData);
      setTodayCheckIn(todayCheck);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    try {
      let lat = 0, lng = 0, locationName = 'Location unavailable', gotLocation = false;
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 });
          }).catch(async (err) => {
            if (err.code === 3 || err.code === 2) {
              return new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
              });
            }
            throw err;
          });
          lat = pos.coords.latitude; lng = pos.coords.longitude; gotLocation = true;
        } catch (geoErr: any) { if (geoErr.code === 1) throw geoErr; }
      }
      if (!gotLocation) {
        try { const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) }); const d = await r.json(); if (d.latitude) { lat = d.latitude; lng = d.longitude; gotLocation = true; } } catch {}
      }
      if (gotLocation) {
        try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`); const d = await r.json(); if (d.display_name) locationName = d.display_name; } catch { locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
      }
      const result = await checkInService.createCheckIn((user as any).engineerId || user.id, lat, lng, locationName);
      setTodayCheckIn(result); loadData();
      alert(gotLocation ? `Checked in at ${locationName}` : 'Checked in (location unavailable)');
    } catch (error: any) {
      alert(error.code === 1 ? 'Location access denied.' : (error.message || 'Check-in failed'));
    }
  };

  const handleCheckOut = async () => {
    if (!todayCheckIn) return;
    try { await checkInService.checkOut(todayCheckIn.id); setTodayCheckIn(null); loadData(); }
    catch { alert('Check-out failed'); }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportForm.clientId) return;
    try {
      const result = await reportService.createReport((user as any).engineerId || user.id, reportForm.clientId, reportForm.workDone, reportForm.issues, reportForm.siteId || undefined);
      const newReport: DailyReport = { ...result, clientName: assignments.find(a => a.clientId === reportForm.clientId)?.clientName || 'Project Report', date: result.date || new Date().toISOString().split('T')[0] };
      setReports(prev => [newReport, ...prev]);
      setReportForm({ clientId: '', siteId: '', workDone: '', issues: '' });
      await loadData(); alert('Report submitted successfully');
    } catch { alert('Failed to submit report'); }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const result = await leaveService.createLeaveRequest((user as any).engineerId || user.id, leaveForm.startDate, leaveForm.endDate, leaveForm.reason);
      setLeaves(prev => [{ ...result, engineerName: user.name, status: 'pending' }, ...prev]);
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      await loadData(); alert('Leave request submitted');
    } catch { alert('Failed to submit leave request'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-500/20"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-400 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium text-xs tracking-widest uppercase">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'leave', label: 'Leave', icon: Calendar },
  ];

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ─── Premium Dark Header ─── */}
      <div className="relative overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-violet-600/10"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/[0.06] rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/[0.04] rounded-full blur-[80px]"></div>

        <div className="relative max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-400/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{greeting}</p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{user?.name}</h1>
              <p className="text-slate-400 text-sm font-medium mt-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Field Engineering Console
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Status', value: todayCheckIn ? (todayCheckIn.checkOutTime ? 'Complete' : 'On Duty') : 'Pending', icon: Activity, dot: todayCheckIn ? (todayCheckIn.checkOutTime ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse') : 'bg-amber-400' },
              { label: 'Total Reports', value: reports.length, icon: FileText, dot: null },
              { label: 'Assignments', value: assignments.length, icon: TrendingUp, dot: null },
              { label: 'Leave Requests', value: leaves.length, icon: Calendar, dot: null },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.05] backdrop-blur-sm rounded-2xl p-5 border border-white/[0.06] hover:bg-white/[0.08] transition-all group">
                <div className="flex items-center gap-2.5 mb-3">
                  <stat.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  {stat.dot && <div className={`w-2 h-2 rounded-full ml-auto ${stat.dot}`}></div>}
                </div>
                <p className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-slate-200 w-full max-w-md mb-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id ? 'bg-[#0f172a] text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ ATTENDANCE ═══ */}
        {activeTab === 'attendance' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            {/* Check-in Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-white font-bold text-sm">Daily Attendance</h2>
                  <p className="text-slate-400 text-[10px] font-medium">GPS-verified check-in system</p>
                </div>
              </div>

              <div className="p-6">
                <div className="p-4 bg-[#f8f9fb] rounded-xl border border-slate-100 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shadow-lg ${todayCheckIn ? (todayCheckIn.checkOutTime ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse shadow-emerald-400/50') : 'bg-amber-400 shadow-amber-300/50'}`}></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
                      <p className="font-bold text-slate-800">{todayCheckIn ? (todayCheckIn.checkOutTime ? 'Session Complete' : 'On Duty') : 'Not Checked In'}</p>
                    </div>
                  </div>
                </div>

                {!todayCheckIn ? (
                  <button onClick={handleCheckIn} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] shadow-md shadow-blue-600/20 group">
                    <Navigation className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                    Check In Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : !todayCheckIn.checkOutTime ? (
                  <button onClick={handleCheckOut} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] shadow-md shadow-rose-600/20">
                    <LogOut className="w-5 h-5" />
                    Check Out
                  </button>
                ) : (
                  <div className="text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col items-center gap-2">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                    <p className="font-bold text-emerald-800">Session Complete</p>
                    <p className="text-sm text-emerald-600/70">Great work today!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-white font-bold text-sm">Recent Activity</h2>
                <span className="ml-auto text-slate-500 text-[10px] font-bold">{checkIns.length} records</span>
              </div>
              <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
                {checkIns.slice(0, 8).map(ci => (
                  <div key={ci.id} className="flex items-center gap-3 p-3.5 bg-[#f8f9fb] rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(ci.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {ci.checkOutTime && <span className="text-slate-400 font-normal"> → {new Date(ci.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{ci.locationName || 'Main Site'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${ci.checkOutTime ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {ci.checkOutTime ? 'Done' : 'Active'}
                    </span>
                  </div>
                ))}
                {checkIns.length === 0 && (
                  <div className="text-center py-10"><Clock className="w-8 h-8 mx-auto mb-3 text-slate-200" /><p className="text-sm text-slate-400">No activity yet</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ REPORTS ═══ */}
        {activeTab === 'reports' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-6xl">
            {/* Submit Report */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-white font-bold text-sm">Submit Daily Report</h2>
                  <p className="text-slate-400 text-[10px] font-medium">Record today's progress</p>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Select Client</label>
                    <select required value={reportForm.clientId} onChange={e => setReportForm({ ...reportForm, clientId: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f8f9fb] border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all appearance-none cursor-pointer">
                      <option value="">Choose a client...</option>
                      {assignments.map((a, idx) => <option key={`${a.clientId}-${idx}`} value={a.clientId}>{a.clientName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Work Completed</label>
                    <textarea required value={reportForm.workDone} onChange={e => setReportForm({ ...reportForm, workDone: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f8f9fb] border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all h-32 resize-none" placeholder="Describe tasks completed today..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Issues <span className="text-slate-300">(Optional)</span></label>
                    <textarea value={reportForm.issues} onChange={e => setReportForm({ ...reportForm, issues: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f8f9fb] border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all h-20 resize-none" placeholder="Any blockers or concerns?" />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20 group">
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Submit Report
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h2 className="text-white font-bold text-sm">Recent Reports</h2>
                <span className="ml-auto text-slate-500 text-[10px] font-bold">{reports.length} total</span>
              </div>
              <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                {reports.length > 0 ? reports.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).slice(0, 10).map(report => (
                  <div key={report.id} className="p-4 bg-[#f8f9fb] rounded-xl border border-slate-100 hover:border-blue-200 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{report.clientName || 'Report'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(report.date || report.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={async () => { const e = prompt("Recipient email:"); if (e) { try { const r = await fetch(`/api/reports/${report.id}/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e }) }); const d = await r.json(); alert(d.message || 'Sent!'); } catch { alert('Failed'); } } }}
                        className="text-[9px] px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-1 transition-colors font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100">
                        <Send className="w-3 h-3" /> Send
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{report.workDone}</p>
                    {report.issues && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                        <span className="text-[11px] text-amber-700">{report.issues}</span>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-14"><FileText className="w-8 h-8 mx-auto mb-3 text-slate-200" /><p className="text-sm text-slate-400">No reports yet</p></div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ LEAVE ═══ */}
        {activeTab === 'leave' && (
          <div className="grid gap-6 md:grid-cols-2 max-w-6xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-violet-400" />
                <div>
                  <h2 className="text-white font-bold text-sm">Request Leave</h2>
                  <p className="text-slate-400 text-[10px] font-medium">Submit for HR approval</p>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={handleLeaveRequest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
                      <input required type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-[#f8f9fb] border border-slate-200 rounded-xl text-sm font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">End Date</label>
                      <input required type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        className="w-full px-4 py-3 bg-[#f8f9fb] border border-slate-200 rounded-xl text-sm font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Reason</label>
                    <textarea required value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f8f9fb] border border-slate-200 rounded-xl text-sm font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white outline-none transition-all h-24 resize-none" placeholder="Briefly explain your reason..." />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-violet-600/20">
                    <Plus className="w-4 h-4" /> Submit Request
                  </button>
                </form>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-[#0f172a] px-6 py-4 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h2 className="text-white font-bold text-sm">Leave History</h2>
                <span className="ml-auto text-slate-500 text-[10px] font-bold">{leaves.length} total</span>
              </div>
              <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto">
                {leaves.length > 0 ? leaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map(leave => (
                  <div key={leave.id} className="p-4 bg-[#f8f9fb] rounded-xl border border-slate-100 hover:border-violet-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{leave.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 italic bg-white p-2.5 rounded-lg">"{leave.reason}"</p>
                  </div>
                )) : (
                  <div className="text-center py-14"><Calendar className="w-8 h-8 mx-auto mb-3 text-slate-200" /><p className="text-sm text-slate-400">No leave requests</p></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
