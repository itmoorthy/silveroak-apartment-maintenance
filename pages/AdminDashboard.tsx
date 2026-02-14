import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Flat, MaintenanceBill, Complaint, BillStatus, ComplaintStatus, NotificationType, UserRole } from '../types';
import StatsCard from '../components/StatsCard';
import { Building2, IndianRupee, MessageSquareWarning, Users, LayoutList, Megaphone, Send, X, Calculator } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setFlats(db.flats.getAll());
    setBills(db.bills.getAll());
    setComplaints(db.complaints.getAll());
  };

  const totalPendingDues = bills
    .filter(b => b.status === BillStatus.PENDING)
    .reduce((sum, b) => sum + b.amount, 0);

  const openComplaintsCount = complaints.filter(c => c.status !== ComplaintStatus.CLOSED).length;
  const occupiedFlats = flats.filter(f => f.status === 'OCCUPIED').length;

  const handleSendNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const residents = db.users.getAll().filter(u => u.role === UserRole.RESIDENT);
    
    residents.forEach(res => {
      db.notifications.create({
        id: `notice-${Date.now()}-${res.id}`,
        userId: res.id,
        title: noticeTitle,
        message: noticeMessage,
        type: NotificationType.INFO,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    alert('Notice broadcasted to all residents.');
    setNoticeTitle('');
    setNoticeMessage('');
    setIsNoticeModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Association Overview</h1>
          <p className="text-slate-500">Key metrics for your apartment complex.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.hash = '#billing'} // Simple routing simulation
            className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 px-5 py-2.5 rounded-xl transition-all font-bold flex items-center gap-2 shadow-sm"
          >
            <Calculator className="w-5 h-5" />
            Maintenance Bill Generator
          </button>
          <button 
            onClick={() => setIsNoticeModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all font-bold flex items-center gap-2 w-fit"
          >
            <Megaphone className="w-5 h-5" />
            Broadcast Notice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          label="Total Units" 
          value={flats.length} 
          icon={Building2} 
          color="blue" 
          trend={`${occupiedFlats} Occupied`}
        />
        <StatsCard 
          label="Pending Collection" 
          value={`₹${totalPendingDues.toLocaleString()}`} 
          icon={IndianRupee} 
          color="amber" 
          trend={`${bills.filter(b => b.status === BillStatus.PENDING).length} Pending Bills`}
        />
        <StatsCard 
          label="Open Issues" 
          value={openComplaintsCount} 
          icon={MessageSquareWarning} 
          color="rose" 
          trend="Needs Attention"
        />
        <StatsCard 
          label="Total Residents" 
          value={occupiedFlats} 
          icon={Users} 
          color="indigo" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-blue-500" />
              Recent Complaints
            </h3>
          </div>
          <div className="space-y-4">
            {complaints.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-800">{c.subject}</h4>
                  <p className="text-xs text-slate-500">Flat {flats.find(f => f.id === c.flatId)?.unitNumber} • {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  c.status === ComplaintStatus.OPEN ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {c.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {complaints.length === 0 && <p className="text-center text-slate-400 py-4">No recent complaints</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
              Recent Billings
            </h3>
          </div>
          <div className="space-y-4">
            {bills.slice(0, 4).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-800">{b.month} Maintenance</h4>
                  <p className="text-xs text-slate-500">Flat {flats.find(f => f.id === b.flatId)?.unitNumber} • ₹{b.amount.toLocaleString()}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  b.status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
            {bills.length === 0 && <p className="text-center text-slate-400 py-4">No billing history found</p>}
          </div>
        </div>
      </div>

      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Megaphone className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Send New Notice</h3>
              </div>
              <button onClick={() => setIsNoticeModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Notice Title</label>
                <input 
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Water Tank Cleaning"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Message Body</label>
                <textarea 
                  required
                  rows={4}
                  value={noticeMessage}
                  onChange={(e) => setNoticeMessage(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Type your notice details here..."
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
              >
                <Send className="w-4 h-4" /> Broadcast to All Residents
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;