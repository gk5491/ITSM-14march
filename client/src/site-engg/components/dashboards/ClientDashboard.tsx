import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, FileText, MapPin, Download, Building2, Clock, TrendingUp, Calendar, LayoutDashboard } from 'lucide-react';
import { Assignment, DailyReport, CheckIn, LeaveRequest, Client, User, Site } from '../../types';
import { exportToCSV } from '../../lib/export';
import { StorageService } from '../../lib/storage';
import MusterRoll from '../MusterRoll';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'enterprise' | 'muster'>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, selectedDate]);

  async function loadData() {
    if (!user) return;

    try {
      setLoading(true);
      const [allClients, allAssignments, allReports, allCheckIns, allLeaves, allEngineers, allSites] = await Promise.all([
        StorageService.getClients(),
        StorageService.getAssignments(),
        StorageService.getDailyReports(),
        StorageService.getCheckIns(),
        StorageService.getLeaveRequests(),
        StorageService.getEngineers(),
        StorageService.getSites()
      ]);

      setEngineers(allEngineers);
      setSites(allSites);

      const clientData = allClients.find((c: Client) => c.email === user.email || c.userId === user.id);
      if (!clientData) {
        setLoading(false);
        return;
      }
      setClient(clientData);

      const clientAssignments = allAssignments.filter((a: Assignment) => a.clientId === clientData.id);
      setAssignments(clientAssignments);

      const engineerIds = clientAssignments.map((a: Assignment) => a.engineerId);

      const filteredReports = allReports.filter((r: DailyReport) => 
        r.date === selectedDate && engineerIds.includes(r.engineerId)
      );
      setReports(filteredReports);

      const filteredCheckIns = allCheckIns.filter((c: CheckIn) =>
        c.date === selectedDate && engineerIds.includes(c.engineerId)
      );
      setCheckIns(filteredCheckIns);

      const filteredLeaves = allLeaves.filter((l: LeaveRequest) =>
        l.status === 'approved' && engineerIds.includes(l.engineerId)
      );
      setLeaves(filteredLeaves);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEngineerById(id: string): User | undefined {
    return engineers.find(e => e.id === id);
  }

  function getSiteById(id: string): Site | undefined {
    return sites.find(s => s.id === id);
  }

  function isEngineerOnLeave(engineerId: string): LeaveRequest | undefined {
    const today = new Date(selectedDate);
    return leaves.find(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return leave.engineerId === engineerId && today >= start && today <= end;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ─── Premium Dark Header ─── */}
      <div className="relative overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-transparent to-orange-600/10"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/[0.06] rounded-full blur-[120px]"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl backdrop-blur-sm">
                <Building2 className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-1.5">{client ? client.name : 'Client Portal'}</p>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Client Dashboard</h1>
                <p className="text-slate-400 text-sm font-medium mt-1">Project oversight & workforce analytics</p>
              </div>
            </div>
            
            <div className="flex gap-2 bg-white/[0.04] p-1.5 rounded-2xl border border-white/[0.08]">
               {[
                 { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                 { id: 'reports', label: 'Work Reports', icon: FileText },
                 { id: 'enterprise', label: 'Enterprise', icon: TrendingUp },
                 { id: 'muster', label: 'Muster Roll', icon: Calendar }
               ].map(t => (
                 <button 
                   key={t.id} 
                   onClick={() => setActiveTab(t.id as any)}
                   className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-[11px] tracking-wide transition-all ${
                     activeTab === t.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                   }`}
                 >
                   <t.icon className="w-4 h-4" />
                   {t.label}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer active:scale-95 duration-300" onClick={() => setActiveTab('enterprise')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Assigned Engineers</h3>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{assignments.length}</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Active assignments</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer active:scale-95 duration-300" onClick={() => setActiveTab('reports')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Today's Reports</h3>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{reports.length}</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Work reports submitted</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer active:scale-95 duration-300" onClick={() => setActiveTab('muster')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-700">Check-ins Today</h3>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{checkIns.length}</p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Engineers checked in</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer active:scale-95 duration-300" onClick={() => setActiveTab('muster')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-700">On Leave</h3>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {assignments.filter(a => isEngineerOnLeave(a.engineerId)).length}
              </p>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Engineers on leave</p>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-slate-900 font-bold uppercase text-xs">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-black">Date View</h2>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        )}

        <div className="grid gap-6 mb-8">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                  <Users className="w-5 h-5 text-blue-600" />
                  Assigned Engineers
                </h3>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {assignments.length > 0 ? assignments.map(assignment => {
                    const engineer = getEngineerById(assignment.engineerId);
                    const site = assignment.siteId ? getSiteById(assignment.siteId) : null;
                    const leave = isEngineerOnLeave(assignment.engineerId);
                    const backupEngineer = leave?.backupEngineerId ? getEngineerById(leave.backupEngineerId) : null;

                    return (
                      <div key={assignment.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900">{engineer?.name || 'Unknown Engineer'}</h4>
                            <p className="text-sm text-slate-600">{engineer?.email}</p>
                            {site && (
                              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                Site: {site.name}
                              </p>
                            )}
                          </div>
                          {leave ? (
                            <div className="text-right">
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                On Leave
                              </span>
                              {backupEngineer && (
                                <p className="text-sm text-slate-600 mt-2">
                                  Backup: {backupEngineer.name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-center py-8 text-slate-500">No engineers assigned yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'enterprise' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Attendance Insights
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {checkIns.length > 0 ? checkIns.map(checkIn => {
                  const engineer = getEngineerById(checkIn.engineerId);
                  return (
                    <div key={checkIn.id} className="border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900">{engineer?.name || 'Unknown Engineer'}</h4>
                          <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Check-in: {new Date(checkIn.checkInTime).toLocaleTimeString()}
                          </p>
                          {checkIn.checkOutTime && (
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              Check-out: {new Date(checkIn.checkOutTime).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        {checkIn.latitude && checkIn.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-4 py-2 rounded-xl transition-all active:scale-95"
                          >
                            <MapPin className="w-4 h-4" />
                            View Site
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center py-8 text-slate-500">No check-ins available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tighter">
                  <FileText className="w-5 h-5 text-green-600" />
                  Work Reports
                </h3>
                <button
                  onClick={() => {
                    const exportData = reports.map(r => {
                      const engineer = getEngineerById(r.engineerId);
                      const site = r.siteId ? getSiteById(r.siteId) : null;
                      return {
                        Engineer: engineer?.name || '',
                        Site: site?.name || '-',
                        Date: r.date,
                        WorkDone: r.workDone,
                        Issues: r.issues || 'None',
                      };
                    });
                    exportToCSV(exportData, `reports-${client?.name || 'client'}-${selectedDate}`);
                  }}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export All
                </button>
              </div>
              <div className="p-6 space-y-4">
                {reports.length > 0 ? reports.map(report => {
                  const engineer = getEngineerById(report.engineerId);
                  const site = report.siteId ? getSiteById(report.siteId) : null;
                  return (
                    <div key={report.id} className="border border-slate-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-xl transition-all duration-300 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 border border-slate-100">{engineer?.name?.charAt(0)}</div>
                          <div>
                            <h4 className="font-black text-slate-800 uppercase leading-none">{engineer?.name || 'Staff'}</h4>
                            {site && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{site.name}</p>}
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          {new Date(report.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Scope of Work</p>
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{report.workDone}"</p>
                        </div>
                        {report.issues && (
                          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">Detected Blockers</p>
                            <p className="text-sm text-red-600 font-bold leading-relaxed">"{report.issues}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-center py-12 text-slate-400 font-black uppercase italic">No status reports found for this interval</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'muster' && (
            <MusterRoll clientId={client?.id} />
          )}
        </div>
      </div>
    </div>
  );
}
