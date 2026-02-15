import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, MaintenanceBill, Complaint, BillStatus, ComplaintStatus } from '../types';
import StatsCard from '../components/StatsCard';
import { ReceiptIndianRupee, MessageSquareWarning, Info, ExternalLink, CheckCircle2, Building2 } from 'lucide-react';

interface ResidentDashboardProps {
  user: User;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [unitNumber, setUnitNumber] = useState<string>('');

  useEffect(() => {
    if (user.flatId) {
      setBills(db.bills.getAll().filter(b => b.flatId === user.flatId));
      setComplaints(db.complaints.getAll().filter(c => c.residentId === user.id));
      
      const flat = db.flats.getAll().find(f => f.id === user.flatId);
      if (flat) setUnitNumber(flat.unitNumber);
    }
  }, [user]);

  const handleMarkPaid = (billId: string) => {
    db.bills.updateStatus(billId, BillStatus.PAID);
    // Refresh local bills state
    if (user.flatId) {
      setBills(db.bills.getAll().filter(b => b.flatId === user.flatId));
    }
  };

  const pendingDues = bills
    .filter(b => b.status === BillStatus.PENDING)
    .reduce((sum, b) => sum + b.amount, 0);

  const activeComplaints = complaints.filter(c => c.status !== ComplaintStatus.CLOSED).length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Home Dashboard</h1>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 shadow-sm">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wider">Apartment No: {unitNumber || 'N/A'}</span>
            </div>
            <span className="text-slate-400 text-sm font-medium">Username: {user.name}</span>
          </div>
        </div>
        <p className="text-slate-500 text-sm max-w-xs md:text-right">
          Review your maintenance history, pay dues, and track service requests for your unit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard 
          label="Total Pending Dues" 
          value={`₹${pendingDues.toLocaleString()}`} 
          icon={ReceiptIndianRupee} 
          color="amber" 
          trend={pendingDues > 0 ? "Clear your dues to avoid penalties" : "No pending dues"}
        />
        <StatsCard 
          label="Your Open Complaints" 
          value={activeComplaints} 
          icon={MessageSquareWarning} 
          color="blue" 
          trend="Track your requests here"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Maintenance & Bills</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">History</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4 px-2">Bill Period</th>
                    <th className="pb-4 px-2">Amount</th>
                    <th className="pb-4 px-2">Status</th>
                    <th className="pb-4 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(b => (
                    <tr key={b.id} className="text-sm group hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-2 font-medium text-slate-700">{b.month} {b.year}</td>
                      <td className="py-4 px-2 text-slate-600 font-bold">₹{b.amount.toLocaleString()}</td>
                      <td className="py-4 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          b.status === BillStatus.PAID 
                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                            : 'bg-rose-100 text-rose-600 border-rose-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {b.status === BillStatus.PENDING ? (
                          <button 
                            onClick={() => handleMarkPaid(b.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-blue-100 transition-all flex items-center gap-1 ml-auto"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 justify-end">
                            Paid <CheckCircle2 className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400 italic">
                        No maintenance bills found for your flat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-indigo-200" />
              <h3 className="font-bold">Association Notice</h3>
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed mb-6 italic">
              "Annual General Meeting (AGM) is scheduled for the last Sunday of next month. All residents are requested to attend."
            </p>
            <button className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-3 rounded-xl transition-all border border-white/20">
              Read all notices <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm font-bold text-slate-700 transition-all border border-slate-100 hover:border-blue-100">
                Raise New Complaint
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm font-bold text-slate-700 transition-all border border-slate-100 hover:border-blue-100">
                Visitor Access Code
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-sm font-bold text-slate-700 transition-all border border-slate-100 hover:border-blue-100">
                Download Last Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;