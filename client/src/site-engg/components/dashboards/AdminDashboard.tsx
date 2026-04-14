import { useState, useEffect } from 'react';
import { Users, Building2, UserCog, Activity, Plus, UserPlus, X, Shield, Settings, TrendingUp, ChevronDown } from 'lucide-react';
import { User, Client, Assignment } from '../../types';
import { StorageService } from '../../lib/storage';
import CompanyProfile from '../CompanyProfile';
import MusterRoll from '../MusterRoll';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'clients' | 'assignments' | 'muster' | 'reports' | 'company-profile' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [engineers, setEngineers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalEngineers: 0, totalClients: 0, activeAssignments: 0, todayCheckIns: 0 });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [userRole, setUserRole] = useState<'engineer' | 'hr' | 'admin'>('engineer');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [clientFormData, setClientFormData] = useState({ name: '', contactPerson: '', email: '', phone: '' });
  const [assignFormData, setAssignFormData] = useState({ engineerId: '', clientId: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      const [allUsers, allClients, allAssignments, allCheckIns] = await Promise.all([
        StorageService.getUsers(),
        StorageService.getClients(),
        StorageService.getAssignments(),
        StorageService.getCheckIns()
      ]);

      const activeAssignments = allAssignments.filter(a => a.status === 'active');
      const allEngineers = allUsers.filter(u => u.role === 'engineer');

      const today = new Date().toISOString().split('T')[0];
      const todayCheckIns = allCheckIns.filter(c => c.date === today);

      setUsers(allUsers);
      setClients(allClients);
      setAssignments(activeAssignments);
      setEngineers(allEngineers);
      setStats({
        totalEngineers: allEngineers.length,
        totalClients: allClients.length,
        activeAssignments: activeAssignments.length,
        todayCheckIns: todayCheckIns.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async function handleAddUser() {
    try {
      await StorageService.addUser({
        id: Math.random().toString(36).substr(2, 9),
        email: formData.email,
        name: formData.name,
        role: userRole,
        phone: formData.phone,
        createdAt: new Date().toISOString()
      });

      setMessage({ type: 'success', text: `${userRole.toUpperCase()} added successfully!` });
      setShowAddUserModal(false);
      setFormData({ name: '', email: '', phone: '', password: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add user' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleAddClient() {
    try {
      await StorageService.createClient({
        name: clientFormData.name,
        contactPerson: clientFormData.contactPerson,
        email: clientFormData.email,
        phone: clientFormData.phone,
        userId: ''
      });

      setMessage({ type: 'success', text: 'Client added successfully!' });
      setShowAddClientModal(false);
      setClientFormData({ name: '', contactPerson: '', email: '', phone: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to add client' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function handleAssignEngineer() {
    try {
      await StorageService.createAssignment({
        engineerId: assignFormData.engineerId,
        clientId: assignFormData.clientId,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        siteId: ''
      });

      setMessage({ type: 'success', text: 'Engineer assigned successfully!' });
      setShowAssignModal(false);
      setAssignFormData({ engineerId: '', clientId: '' });
      await loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to assign engineer' });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'assignments', label: 'Assignments', icon: UserCog },
    { id: 'muster', label: 'Muster Roll', icon: TrendingUp },
    { id: 'company-profile', label: 'Company', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* ─── Premium Dark Header ─── */}
      <div className="relative overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-rose-600/10"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/[0.06] rounded-full blur-[120px]"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start gap-4 mb-2">
            <div className="p-3 bg-white/[0.06] border border-white/[0.08] rounded-2xl backdrop-blur-sm">
              <Shield className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <p className="text-rose-400/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-1.5">System Administration</p>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Platform management & configuration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} label="Total Engineers" value={stats.totalEngineers} color="blue" />
          <StatCard icon={Building2} label="Total Clients" value={stats.totalClients} color="green" />
          <StatCard icon={UserCog} label="Active Assignments" value={stats.activeAssignments} color="orange" />
          <StatCard icon={TrendingUp} label="Today's Check-ins" value={stats.todayCheckIns} color="purple" />
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 shadow-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2">
          <div className="border-b border-slate-200 bg-white">
            <nav className="flex px-2 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-5 flex items-center gap-2 border-b-2 font-semibold text-sm transition-all whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'border-rose-600 text-rose-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-xl'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2.5px] bg-rose-600 rounded-t-full"></div>}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => { setUserRole('engineer'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Engineer</p>
                      <p className="text-xs text-slate-600">Create new engineer account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setUserRole('hr'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 hover:border-green-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <UserPlus className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add HR</p>
                      <p className="text-xs text-slate-600">Create new HR account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-xl hover:bg-orange-50 hover:border-orange-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Client</p>
                      <p className="text-xs text-slate-600">Create new client</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-3 p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <UserCog className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Assign Engineer</p>
                      <p className="text-xs text-slate-600">Assign engineer to client</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setUserRole('admin'); setShowAddUserModal(true); }}
                    className="flex items-center gap-3 p-4 border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all text-left group"
                  >
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <UserPlus className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Add Admin</p>
                      <p className="text-xs text-slate-600">Create new admin account</p>
                    </div>
                  </button>
                </div>
                <div className="text-center py-8 border-t border-slate-200">
                  <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="text-base font-medium text-slate-900 mb-1">System Overview</h3>
                  <p className="text-sm text-slate-600">Use quick actions above or navigate through tabs to manage system</p>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                  <button
                    onClick={() => { setUserRole('engineer'); setShowAddUserModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700' :
                              user.role === 'engineer' ? 'bg-blue-100 text-blue-700' :
                                user.role === 'hr' ? 'bg-green-100 text-green-700' :
                                  'bg-orange-100 text-orange-700'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{user.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Client Management</h2>
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Add Client
                  </button>
                </div>
                <div className="grid gap-4">
                  {clients.map(client => (
                    <div key={client.id} className="border border-slate-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                      <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-600" />
                        {client.name}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Email:</span>
                          <span className="ml-2 text-slate-900">{client.email}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Phone:</span>
                          <span className="ml-2 text-slate-900">{client.phone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Contact:</span>
                          <span className="ml-2 text-slate-900">{client.contactPerson || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'muster' && (
              <MusterRoll />
            )}

            {activeTab === 'assignments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">Engineer Assignments</h2>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Engineer
                  </button>
                </div>
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const engineer = engineers.find(e => e.id === assignment.engineerId);
                    const client = clients.find(c => c.id === assignment.clientId);
                    return (
                      <div key={assignment.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center hover:border-purple-300 hover:shadow-md transition-all bg-gradient-to-r from-white to-slate-50">
                        <div>
                          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            {engineer?.name || 'Unknown Engineer'}
                          </h3>
                          <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                            <Building2 className="w-3 h-3" />
                            Assigned to: {client?.name || 'Unknown Client'}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <p className="text-center py-8 text-slate-500">No active assignments</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'company-profile' && (
              <CompanyProfile />
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-6">System Settings</h2>
                <div className="space-y-4">
                  <div className="p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-600" />
                      System Information
                    </h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>Version: 1.0.0</p>
                      <p>Environment: Development</p>
                      <p>Database: PostgreSQL</p>
                    </div>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-xl bg-gradient-to-r from-white to-slate-50">
                    <h3 className="font-semibold text-slate-900 mb-2">Admin Actions</h3>
                    <p className="text-sm text-slate-600 mb-4">Manage system-wide configurations and settings</p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                        View Logs
                      </button>
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                        System Reports
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/20 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Add {userRole.toUpperCase()}</h2>
                  <p className="text-sm font-medium text-slate-500">Create a new system account</p>
                </div>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <button
                onClick={handleAddUser}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:from-blue-700 hover:to-indigo-800 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/20 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Add Client</h2>
                  <p className="text-sm font-medium text-slate-500">Register a new partner client</p>
                </div>
              </div>
              <button onClick={() => setShowAddClientModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Organization Name</label>
                <input
                  type="text"
                  value={clientFormData.name}
                  onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Key Contact Person</label>
                <input
                  type="text"
                  value={clientFormData.contactPerson}
                  onChange={(e) => setClientFormData({ ...clientFormData, contactPerson: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="Contact Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Business Email</label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="contact@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Office Phone</label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <button
                onClick={handleAddClient}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:from-orange-700 hover:to-amber-800 transition-all shadow-xl shadow-orange-200 active:scale-[0.98]"
              >
                Register Client
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-md border border-white/20 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                  <UserCog className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Assign Engineer</h2>
                  <p className="text-sm font-medium text-slate-500">Deploy resource to client site</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select Field Engineer</label>
                <div className="relative">
                  <select
                    value={assignFormData.engineerId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, engineerId: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Choose an engineer...</option>
                    {engineers.map(eng => (
                      <option key={eng.id} value={eng.id}>{eng.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Client</label>
                <div className="relative">
                  <select
                    value={assignFormData.clientId}
                    onChange={(e) => setAssignFormData({ ...assignFormData, clientId: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <button
                onClick={handleAssignEngineer}
                disabled={!assignFormData.engineerId || !assignFormData.clientId}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-800 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:from-purple-700 hover:to-violet-900 transition-all shadow-xl shadow-purple-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:active:scale-100"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: 'blue' | 'green' | 'orange' | 'purple' }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-600 to-indigo-700 shadow-blue-200/50',
    green: 'from-emerald-500 to-teal-700 shadow-emerald-200/50',
    orange: 'from-orange-500 to-amber-700 shadow-orange-200/50',
    purple: 'from-indigo-600 to-violet-800 shadow-purple-200/50',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} p-6 rounded-[2rem] text-white shadow-xl transform transition-all hover:scale-[1.03] hover:shadow-2xl duration-300 border border-white/10 group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 group-hover:bg-white/30 transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        <TrendingUp className="w-4 h-4 text-white/40" />
      </div>
      <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-4xl font-black mt-2 tracking-tighter">{value}</p>
    </div>
  );
}
