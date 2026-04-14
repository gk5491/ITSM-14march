import React, { useState, useEffect } from 'react';
import { Users, MapPin, FileText, Download, Filter, Calendar } from 'lucide-react';
import { exportToCSV } from '../../lib/export';
import { assignmentService } from '../../services/assignmentService';
import { checkInService } from '../../services/checkInService';
import { reportService } from '../../services/reportService';
import { StorageService } from '../../lib/storage';
import type { Assignment, CheckIn, Engineer, Client } from '../../types';

interface ClientWiseEngineer {
  engineerId: string;
  engineerName: string;
  designation: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  todayCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  lastLocation?: string;
  hasReport: boolean;
  reportWorkDone?: string;
  reportIssues?: string;
}

export default function HRClientWiseView() {
  const [clientWiseData, setClientWiseData] = useState<ClientWiseEngineer[]>([]);
  const [filteredData, setFilteredData] = useState<ClientWiseEngineer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    applyFilters();
  }, [selectedClient, selectedEngineer, clientWiseData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [assignments, allCheckIns, allReports, clientsList, engineersList] = await Promise.all([
        assignmentService.getAllAssignments(),
        checkInService.getAllCheckIns(),
        reportService.getReports(),
        StorageService.getClients(),
        StorageService.getEngineers()
      ]);

      const checkIns = allCheckIns.filter(ci => ci.date === selectedDate);
      const reports = allReports.filter(r => r.date === selectedDate);

      setClients(clientsList);
      setEngineers(engineersList);

      const clientWiseEngineers: ClientWiseEngineer[] = assignments.map((assignment: any) => {
        const checkIn = checkIns.find((ci: any) => ci.engineerId === assignment.engineerId);
        const report = reports.find((r: any) =>
          r.engineerId === assignment.engineerId &&
          r.clientId === assignment.clientId
        );

        return {
          engineerId: assignment.engineerId,
          engineerName: assignment.engineerName || 'Unknown',
          designation: assignment.engineerDesignation || 'Engineer',
          clientId: assignment.clientId,
          clientName: assignment.clientName || 'Unknown Client',
          siteId: assignment.siteId,
          siteName: assignment.siteName || 'N/A',
          todayCheckedIn: !!checkIn,
          checkInTime: checkIn?.checkInTime,
          checkOutTime: checkIn?.checkOutTime,
          lastLocation: checkIn?.locationName || 'No location',
          hasReport: !!report,
          reportWorkDone: report?.workDone,
          reportIssues: report?.issues
        };
      });

      setClientWiseData(clientWiseEngineers);
    } catch (error) {
      console.error('Error fetching client-wise data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clientWiseData];
    if (selectedClient !== 'all') {
      filtered = filtered.filter(item => item.clientId === selectedClient);
    }
    if (selectedEngineer !== 'all') {
      filtered = filtered.filter(item => item.engineerId === selectedEngineer);
    }
    setFilteredData(filtered);
  };

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      'Engineer Name': item.engineerName,
      'Designation': item.designation,
      'Client Name': item.clientName,
      'Site Name': item.siteName,
      'Check-in Status': item.todayCheckedIn ? 'Checked In' : 'Not Checked In',
      'Check-in Time': item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString() : '-',
      'Check-out Time': item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString() : '-',
      'Last Location': item.lastLocation,
      'Report Status': item.hasReport ? 'Submitted' : 'Pending',
      'Work Done': item.reportWorkDone || '-',
      'Issues': item.reportIssues || '-'
    }));
    exportToCSV(exportData, `client-wise-engineers-${selectedDate}`);
  };

  const groupedByClient = filteredData.reduce((acc, item) => {
    if (!acc[item.clientId]) {
      acc[item.clientId] = { clientName: item.clientName, engineers: [] };
    }
    acc[item.clientId].engineers.push(item);
    return acc;
  }, {} as Record<string, { clientName: string; engineers: ClientWiseEngineer[] }>);

  if (loading) return <div className="p-12 text-center animate-pulse text-slate-400">Loading data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Client-wise Engineers</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Data</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Clients</option>
              {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Engineer</label>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              className="w-full rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Engineers</option>
              {engineers.map(engineer => <option key={engineer.id} value={engineer.id}>{engineer.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedByClient).length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium text-lg">No engineer assignments found</p>
          </div>
        ) : (
          Object.entries(groupedByClient).map(([clientId, { clientName, engineers: clientEngineers }]) => (
            <div key={clientId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{clientName}</h3>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mt-1">
                  {clientEngineers.length} {clientEngineers.length === 1 ? 'Engineer' : 'Engineers'} Assigned
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Engineer</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Report</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {clientEngineers.map((engineer) => (
                      <React.Fragment key={engineer.engineerId}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">{engineer.engineerName}</p>
                            <p className="text-xs text-slate-500">{engineer.designation}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${engineer.todayCheckedIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {engineer.todayCheckedIn ? 'Present' : 'Absent'}
                              </span>
                              {engineer.checkInTime && (
                                <p className="text-[10px] text-slate-400 font-medium">
                                  In: {new Date(engineer.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700 font-medium">{engineer.siteName}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-slate-300" />
                              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{engineer.lastLocation}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${engineer.hasReport ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {engineer.hasReport ? 'Submitted' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {engineer.hasReport && (
                              <button
                                onClick={() => setExpandedReport(expandedReport === engineer.engineerId ? null : engineer.engineerId)}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold text-xs"
                              >
                                <FileText className="w-4 h-4" />
                                {expandedReport === engineer.engineerId ? 'Hide' : 'View'}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedReport === engineer.engineerId && (
                          <tr className="bg-slate-50">
                            <td colSpan={5} className="px-6 py-6 border-l-4 border-blue-500">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Work Done</p>
                                  <p className="text-sm text-slate-700 leading-relaxed">{engineer.reportWorkDone}</p>
                                </div>
                                {engineer.reportIssues && (
                                  <div>
                                    <p className="text-xs font-bold text-red-400 uppercase mb-2">Issues Reported</p>
                                    <p className="text-sm text-red-600 leading-relaxed font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                                      {engineer.reportIssues}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
