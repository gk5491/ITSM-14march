import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hasRole, hasAnyRole } from "@/lib/role-utils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Bug, Edit2, Trash2, Check, X, Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function BugReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: currentUser } = useAuth();

  // Allow bug report for all logged-in users (admin, agent, user) - support multi-role users like "admin,agent"
  const canSubmitBug = !!currentUser && hasAnyRole(currentUser?.role, ["admin", "agent", "user"]);

  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editComment, setEditComment] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'not-resolved'>('all');

  const isMobile = window.innerWidth < 768;

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users");
      return await res.json();
    },
    enabled: !!currentUser,
  });

  const { data: allBugReports = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/project-bug-reports"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/project-bug-reports.php");
      return await res.json();
    },
    // enabled: !!currentUser, // allow all roles to see
    enabled: true,
  });

  const getUserName = (id: number) => {
    const u = allUsers.find((x: any) => x.id === id);
    return u ? (u.name || u.username || u.fullName) : String(id);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg','image/jpg','image/png','image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    const input = document.getElementById('screenshot-input') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  // Only show user's own bugs if user role, else show all
  let filteredReports = allBugReports;
  if (hasRole(currentUser?.role, 'user') && currentUser?.id) {
    filteredReports = allBugReports.filter((r: any) => r.created_by === currentUser.id);
  }
  const bugReports = filteredReports.filter((r: any) => {
    if (statusFilter === 'all') return true;
    return (r.resolution_status || 'not-resolved') === statusFilter;
  });

  // Summary stats
  const totalReports = allBugReports.length;
  const yourReports = allBugReports.filter((r: any) => r.created_by === currentUser?.id).length;
  const resolvedReports = allBugReports.filter((r: any) => (r.resolution_status || 'not-resolved') === 'resolved').length;

  const handleEdit = (id: number, comment: string) => {
    setEditingId(id);
    setEditComment(comment);
  };

  const handleEditSave = async (id: number) => {
    try {
      await apiRequest('PATCH', '/api/project-bug-reports.php', { id, comment: editComment, user_id: currentUser?.id });
      setEditingId(null);
      setEditComment('');
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiRequest('DELETE', '/api/project-bug-reports.php', { id, user_id: currentUser?.id });
      refetch();
    } catch (err) {
      console.error(err);
    }
    setDeletingId(null);
  };

  const handleToggleResolution = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'resolved' ? 'not-resolved' : 'resolved';
    try {
      await apiRequest('PATCH', '/api/project-bug-reports.php', { id, resolution_status: newStatus, user_id: currentUser?.id });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || !currentUser?.id) return;
    setSubmitting(true);
    setSubmitSuccess(false);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('comment', feedback);
        formData.append('created_by', String(currentUser.id));
        formData.append('resolutionStatus','not-resolved');
        formData.append('screenshot', selectedFile);
        await apiRequest('POST', '/api/project-bug-reports.php', formData);
      } else {
        await apiRequest('POST', '/api/project-bug-reports.php', { comment: feedback, created_by: currentUser.id, resolutionStatus: 'not-resolved' });
      }
      setSubmitSuccess(true);
      setFeedback('');
      removeSelectedFile();
      refetch();
    } catch (err) {
      console.error(err);
      setSubmitSuccess(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Bug Review" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center"><Bug className="h-6 w-6 mr-2 text-red-500"/> Submit Feedback / Bug Report</h1>

            {/* Summary Cards */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex-1 min-w-[200px] bg-white rounded-lg shadow p-4 flex items-center gap-4 border">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2"><Bug className="h-6 w-6"/></div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Total Reports</div>
                  <div className="text-2xl font-bold">{totalReports}</div>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] bg-white rounded-lg shadow p-4 flex items-center gap-4 border">
                <div className="bg-green-100 text-green-600 rounded-full p-2"><Bug className="h-6 w-6"/></div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Your Reports</div>
                  <div className="text-2xl font-bold">{yourReports}</div>
                </div>
              </div>
              <div className="flex-1 min-w-[200px] bg-white rounded-lg shadow p-4 flex items-center gap-4 border">
                <div className="bg-orange-100 text-orange-600 rounded-full p-2"><Bug className="h-6 w-6"/></div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Resolved Reports</div>
                  <div className="text-2xl font-bold">{resolvedReports}</div>
                  <div className="text-xs text-gray-400">All time</div>
                </div>
              </div>
            </div>

            {canSubmitBug && (
              <div className="max-w-lg mb-8">
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">Describe the issue or feedback</label>
                    <textarea id="feedback" className="border rounded px-3 py-2 w-full min-h-[80px]" placeholder="Describe the issue or feedback..." value={feedback} onChange={e=>setFeedback(e.target.value)} disabled={submitting} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Screenshot (Optional)</label>
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input type="file" id="screenshot-input" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={submitting} />
                        <label htmlFor="screenshot-input" className="cursor-pointer flex flex-col items-center">
                          <Camera className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload a screenshot</span>
                          <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                        </label>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <Image className="h-6 w-6 text-blue-500 mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size/1024/1024).toFixed(2)} MB</p>
                            {previewUrl && (<div className="mt-2"><img src={previewUrl} alt="Preview" className="max-w-full h-auto max-h-32 rounded border"/></div>)}
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={removeSelectedFile} disabled={submitting} className="text-red-600 hover:text-red-700"><X className="h-4 w-4"/></Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={submitting || !feedback.trim()} className="w-full">{submitting ? 'Submitting...' : 'Submit Feedback'}</Button>
                  {submitSuccess && <div className="text-green-600 text-sm font-medium">Feedback submitted successfully!</div>}
                </form>
              </div>
            )}

            <div className="w-full mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Submitted Bug Reports</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={()=>setStatusFilter('all')} className="text-xs">All ({filteredReports.length})</Button>
                  <Button size="sm" variant={statusFilter === 'resolved' ? 'default' : 'outline'} onClick={()=>setStatusFilter('resolved')} className="text-xs">Resolved ({filteredReports.filter((r:any)=>(r.resolution_status||'not-resolved')==='resolved').length})</Button>
                  <Button size="sm" variant={statusFilter === 'not-resolved' ? 'default' : 'outline'} onClick={()=>setStatusFilter('not-resolved')} className="text-xs">Not Resolved ({filteredReports.filter((r:any)=>(r.resolution_status||'not-resolved')==='not-resolved').length})</Button>
                </div>
              </div>

              {bugReports.length === 0 ? (
                <div className="text-neutral-500 p-4 text-center border rounded-md bg-white">No reports found.</div>
              ) : (
                <div className="bg-white border rounded-md shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-100 border-b">
                          <th className="p-3 text-left font-medium w-16">ID</th>
                          <th className="p-3 text-left font-medium min-w-[300px]">Comment</th>
                          <th className="p-3 text-left font-medium w-32">Screenshot</th>
                          <th className="p-3 text-left font-medium w-32">Created By</th>
                          <th className="p-3 text-left font-medium w-32">Status</th>
                          <th className="p-3 text-left font-medium w-40">Created At</th>
                          <th className="p-3 text-left font-medium w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bugReports.map((r: any) => (
                          <tr key={r.id} className="border-b hover:bg-neutral-50">
                            <td className="p-3 font-mono text-gray-600">#{r.id}</td>
                            <td className="p-3">{editingId === r.id ? (<textarea className="border rounded px-2 py-1 w-full min-h-[60px] resize-none" value={editComment} onChange={e=>setEditComment(e.target.value)} />) : (<div className="whitespace-pre-wrap break-words">{r.comment}</div>)}</td>
                            <td className="p-3">{r.screenshot_path ? (
                              <div className="flex items-center">
                                <img
                                  src={r.screenshot_path.startsWith('uploads/') ? `/${r.screenshot_path}` : `/uploads/bug-screenshots/${r.screenshot_path}`}
                                  alt="Bug screenshot"
                                  className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-75"
                                  onClick={()=>window.open(r.screenshot_path.startsWith('uploads/') ? `/${r.screenshot_path}` : `/uploads/bug-screenshots/${r.screenshot_path}`,'_blank')}
                                  title="Click to view full size"
                                />
                              </div>
                            ) : (<span className="text-gray-400 text-sm">No screenshot</span>)}
                            </td>
                            <td className="p-3"><div className="flex items-center"><div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">{getUserName(r.created_by).toString().substring(0,1)}</div><span className="text-sm font-medium">{getUserName(r.created_by)}</span></div></td>
                            <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${r.resolution_status==='resolved'? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.resolution_status==='resolved' ? 'Resolved' : 'Not Resolved'}</span></td>
                            <td className="p-3 text-gray-600"><div className="text-xs"><div>{new Date(r.created_at).toLocaleDateString()}</div><div className="text-gray-500">{new Date(r.created_at).toLocaleTimeString()}</div></div></td>
                            <td className="p-3">{
                              (hasRole(currentUser?.role, 'admin') || r.created_by === currentUser?.id) ? (
                                editingId === r.id ? (
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={()=>handleEditSave(r.id)} className="h-8 w-8 p-0" title="Save"><Check className="h-4 w-4"/></Button>
                                    <Button size="sm" variant="outline" onClick={()=>setEditingId(null)} className="h-8 w-8 p-0" title="Cancel"><X className="h-4 w-4"/></Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant={r.resolution_status==='resolved' ? 'default' : 'outline'} onClick={()=>handleToggleResolution(r.id, r.resolution_status || 'not-resolved')} className="h-8 w-8 p-0" title={r.resolution_status==='resolved' ? 'Mark as Unresolved' : 'Mark as Resolved'}><Check className="h-4 w-4"/></Button>
                                    <Button size="sm" variant="outline" onClick={()=>handleEdit(r.id, r.comment)} className="h-8 w-8 p-0" title="Edit"><Edit2 className="h-4 w-4"/></Button>
                                    <Button size="sm" variant="destructive" onClick={()=>handleDelete(r.id)} disabled={deletingId===r.id} className="h-8 w-8 p-0" title="Delete">{deletingId===r.id ? (<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>) : (<Trash2 className="h-4 w-4"/>)}</Button>
                                  </div>
                                )
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )
                            }</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
