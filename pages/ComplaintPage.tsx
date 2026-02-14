
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Complaint, User, UserRole, ComplaintStatus, Flat, NotificationType } from '../types';
import { MessageSquareWarning, Plus, CheckCircle, Clock, Trash2, Send } from 'lucide-react';

interface ComplaintPageProps {
  user: User;
}

const ComplaintPage: React.FC<ComplaintPageProps> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isRaising, setIsRaising] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    refreshData();
    setFlats(db.flats.getAll());
  }, [user]);

  const refreshData = () => {
    const all = db.complaints.getAll();
    if (user.role === UserRole.ADMIN) {
      setComplaints(all);
    } else {
      setComplaints(all.filter(c => c.residentId === user.id));
    }
  };

  const handleRaise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.flatId) return;

    db.complaints.create({
      id: `c-${Date.now()}`,
      flatId: user.flatId,
      residentId: user.id,
      subject: newSubject,
      description: newDesc,
      status: ComplaintStatus.OPEN,
      comments: [],
      createdAt: new Date().toISOString()
    });

    // Notify Admin
    const admins = db.users.getAll().filter(u => u.role === UserRole.ADMIN);
    const unit = flats.find(f => f.id === user.flatId)?.unitNumber;
    admins.forEach(admin => {
      db.notifications.create({
        id: `admin-comp-${Date.now()}-${admin.id}`,
        userId: admin.id,
        title: 'New Complaint Raised',
        message: `Resident of Flat ${unit} has raised a new issue: ${newSubject}`,
        type: NotificationType.COMPLAINT,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    setNewSubject('');
    setNewDesc('');
    setIsRaising(false);
    refreshData();
  };

  const updateStatus = (id: string, status: ComplaintStatus) => {
    const comment = prompt('Add an update comment (optional):');
    db.complaints.updateStatus(id, status, comment || undefined);
    
    // Notify Resident
    const complaint = db.complaints.getAll().find(c => c.id === id);
    if (complaint) {
      db.notifications.create({
        id: `status-update-${Date.now()}`,
        userId: complaint.residentId,
        title: 'Complaint Status Updated',
        message: `Your complaint "${complaint.subject}" is now ${status.replace('_', ' ')}.`,
        type: status === ComplaintStatus.CLOSED ? NotificationType.SUCCESS : NotificationType.INFO,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints & Requests</h1>
          <p className="text-slate-500">
            {user.role === UserRole.ADMIN ? 'Manage resident issues and service requests.' : 'Track your service requests and reported issues.'}
          </p>
        </div>
        
        {user.role === UserRole.RESIDENT && (
          <button 
            onClick={() => setIsRaising(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-100 transition-all font-bold flex items-center gap-2 w-fit"
          >
            <Plus className="w-5 h-5" />
            Raise New Complaint
          </button>
        )}
      </div>

      {isRaising && (
        <div className="bg-white p-6 rounded-2xl border-2 border-blue-500 shadow-xl animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Report an Issue</h3>
          <form onSubmit={handleRaise} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Subject</label>
              <input 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Briefly describe the problem (e.g., Water Leakage)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Details</label>
              <textarea 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32" 
                placeholder="Explain the issue in detail..."
                required
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsRaising(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(c => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  c.status === ComplaintStatus.OPEN ? 'bg-amber-50 text-amber-600' :
                  c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  <MessageSquareWarning className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">{c.subject}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === ComplaintStatus.OPEN ? 'bg-amber-100 text-amber-600' :
                      c.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{c.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(c.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Unit {flats.find(f => f.id === c.flatId)?.unitNumber}</span>
                  </div>
                </div>
              </div>

              {user.role === UserRole.ADMIN && c.status !== ComplaintStatus.CLOSED && (
                <div className="flex items-center gap-2 pt-4 md:pt-0">
                  <button 
                    onClick={() => updateStatus(c.id, ComplaintStatus.IN_PROGRESS)}
                    className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Start Fix
                  </button>
                  <button 
                    onClick={() => updateStatus(c.id, ComplaintStatus.CLOSED)}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              )}
            </div>

            {c.comments.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Updates</p>
                {c.comments.map((comment, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Send className="w-3.5 h-3.5 text-blue-500 mt-1" />
                    <p>{comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {complaints.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-400">No Complaints Reported</h4>
            <p className="text-slate-400">Everything seems to be working perfectly!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintPage;
