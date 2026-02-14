
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, MaintenanceBill, Complaint, BillStatus, ComplaintStatus } from '../types';
import StatsCard from '../components/StatsCard';
import { ReceiptIndianRupee, MessageSquareWarning, Info, ExternalLink } from 'lucide-react';

interface ResidentDashboardProps {
  user: User;
}

const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user }) => {
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    if (user.flatId) {
      setBills(db.bills.getAll().filter(b => b.flatId === user.flatId));
      setComplaints(db.complaints.getAll().filter(c => c.residentId === user.id));
    }
  }, [user]);

  const pendingDues = bills
    .filter(b => b.status === BillStatus.PENDING)
    .reduce((sum, b) => sum + b.amount, 0);

  const activeComplaints = complaints.filter(c => c.status !== ComplaintStatus.CLOSED).length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Home Dashboard</h1>
        <p className="text-slate-500">Manage your flat dues and support requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard 
          label="Total Pending Dues" 
          value={`₹${pendingDues.toLocaleString()}`} 
          icon={ReceiptIndianRupee} 
          color="amber" 
          trend="Click to pay now"
        />
        <StatsCard 
          label="Your Open Complaints" 
          value={activeComplaints} 
          icon={MessageSquareWarning} 
          color="blue" 
          trend="Being tracked"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Bills</h3>
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
                  {bills.map(b => (
                    <tr key={b.id} className="text-sm">
                      <td className="py-4 px-2 font-medium text-slate-700">{b.month} {b.year}</td>
                      <td className="py-4 px-2 text-slate-600">₹{b.amount.toLocaleString()}</td>
                      <td className="py-4 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {b.status === BillStatus.PENDING && (
                          <button className="text-blue-600 font-bold hover:underline">Pay</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">No bills found for your flat.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-indigo-200" />
              <h3 className="font-bold">Latest Notice</h3>
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed mb-4">
              "The water tank cleaning is scheduled for this Sunday between 10 AM to 2 PM. There will be no water supply during this period."
            </p>
            <button className="flex items-center gap-2 text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors">
              Read all notices <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors">Raise New Complaint</button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors">Visitor Access Code</button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-700 transition-colors">Download Last Receipt</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
