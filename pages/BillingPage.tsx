import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { MaintenanceBill, MaintenanceMaster, User, UserRole, BillStatus, Flat, NotificationType } from '../types';
import { ReceiptIndianRupee, Calendar, Filter, Plus, FileText, CheckCircle2, User as UserIcon, AlertCircle, X, Calculator, IndianRupee, Layers } from 'lucide-react';

interface BillingPageProps {
  user: User;
}

const BillingPage: React.FC<BillingPageProps> = ({ user }) => {
  const [bills, setBills] = useState<MaintenanceBill[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [masters, setMasters] = useState<MaintenanceMaster[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generator Form State
  const [form, setForm] = useState({
    month: 'February',
    year: 2024,
    waterCharges: 0,
    sewageCharges: 0,
    securityCharges: 0,
    bescom: 0,
    bwssb: 0,
    pettyCash: 0,
    miscellaneous: 0
  });

  useEffect(() => {
    refreshData();
  }, [user]);

  const refreshData = () => {
    const allBills = db.bills.getAll();
    const allFlats = db.flats.getAll();
    const allUsers = db.users.getAll();
    const allMasters = db.maintenanceMasters.getAll();
    setFlats(allFlats);
    setUsers(allUsers);
    setMasters(allMasters);
    
    if (user.role === UserRole.ADMIN) {
      setBills(allBills);
    } else if (user.flatId) {
      setBills(allBills.filter(b => b.flatId === user.flatId));
    }
  };

  const calculateTotal = () => {
    return (
      Number(form.waterCharges) +
      Number(form.sewageCharges) +
      Number(form.securityCharges) +
      Number(form.bescom) +
      Number(form.bwssb) +
      Number(form.pettyCash) +
      Number(form.miscellaneous)
    );
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate
    if (db.maintenanceMasters.exists(form.month, Number(form.year))) {
      alert(`Error: Maintenance bills for ${form.month} ${form.year} have already been generated.`);
      return;
    }

    const total = calculateTotal();
    if (total <= 0) {
      alert("Error: Total maintenance amount must be greater than 0.");
      return;
    }

    const flatCount = flats.length;
    if (flatCount === 0) {
      alert("Error: No flats found in the system to allocate bills.");
      return;
    }

    const perFlat = Math.round(total / flatCount);
    
    setIsGenerating(true);

    setTimeout(() => {
      // 1. Create Master Record
      const masterId = `master-${Date.now()}`;
      const masterRecord: MaintenanceMaster = {
        id: masterId,
        month: form.month,
        year: Number(form.year),
        waterCharges: Number(form.waterCharges),
        sewageCharges: Number(form.sewageCharges),
        securityCharges: Number(form.securityCharges),
        bescom: Number(form.bescom),
        bwssb: Number(form.bwssb),
        pettyCash: Number(form.pettyCash),
        miscellaneous: Number(form.miscellaneous),
        totalAmount: total,
        perFlatAmount: perFlat,
        createdAt: new Date().toISOString()
      };
      db.maintenanceMasters.create(masterRecord);

      // 2. Create Allocations for ALL Flats
      flats.forEach(f => {
        db.bills.create({
          id: `b-${Date.now()}-${f.id}`,
          masterId: masterId,
          flatId: f.id,
          month: form.month,
          year: Number(form.year),
          amount: perFlat,
          status: BillStatus.PENDING,
          createdAt: new Date().toISOString()
        });

        // 3. Notify Resident if occupied
        if (f.residentId) {
          db.notifications.create({
            id: `bill-notify-${Date.now()}-${f.residentId}`,
            userId: f.residentId,
            title: `Maintenance Bill Generated`,
            message: `Maintenance for ${form.month} ${form.year} of ₹${perFlat.toLocaleString()} has been generated.`,
            type: NotificationType.BILLING,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      });

      setIsGenerating(false);
      setIsModalOpen(false);
      refreshData();
      alert(`Success: Bills generated for ${flatCount} units. Per-flat amount: ₹${perFlat.toLocaleString()}`);
    }, 1000);
  };

  const markPaid = (id: string) => {
    db.bills.updateStatus(id, BillStatus.PAID);
    refreshData();
  };

  const totalGeneratedAmount = masters.reduce((sum, m) => sum + m.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Bill Generator</h1>
          <p className="text-slate-500">Calculate and allocate monthly maintenance costs to all units.</p>
        </div>
        
        {user.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-100 transition-all font-bold flex items-center gap-2 w-fit"
          >
            <Plus className="w-5 h-5" />
            Generate Maintenance Bills
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-700">Billing Records</h3>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <Filter className="w-4 h-4" /> Filter by Period
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Bill Period</th>
                    {user.role === UserRole.ADMIN && <th className="px-6 py-4">Flat No.</th>}
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(b => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-800">{b.month} {b.year}</span>
                        </div>
                      </td>
                      {user.role === UserRole.ADMIN && (
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          Unit {flats.find(f => f.id === b.flatId)?.unitNumber || 'N/A'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{b.amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          b.status === BillStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role === UserRole.ADMIN && b.status === BillStatus.PENDING ? (
                          <button 
                            onClick={() => markPaid(b.id)}
                            className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 ml-auto transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Mark Paid
                          </button>
                        ) : (
                          <button className="text-xs font-bold text-blue-600 hover:underline">View Breakdown</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={user.role === UserRole.ADMIN ? 5 : 4} className="py-20 text-center text-slate-400">
                        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No maintenance bills generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {user.role === UserRole.ADMIN && (
            <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5" /> Summary
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-indigo-500 pb-2">
                  <span className="text-xs text-indigo-200">Total Generated</span>
                  <span className="font-bold">₹{totalGeneratedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-indigo-200">Avg. Per Flat</span>
                  <span className="font-bold">₹2,500</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Information
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Maintenance bills are calculated based on total common expenses divided equally among all registered flats. 
            </p>
          </div>
        </div>
      </div>

      {/* Generator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calculator className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Maintenance Bill Generator</h3>
                  <p className="text-xs text-slate-500">Calculate monthly breakdown for all {flats.length} flats</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Month</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.month}
                    onChange={(e) => setForm({...form, month: e.target.value})}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Year</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.year}
                    onChange={(e) => setForm({...form, year: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Water Charges (₹)</label>
                    <input 
                      type="number" min="0" required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.waterCharges}
                      onChange={(e) => setForm({...form, waterCharges: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sewage Charges (₹)</label>
                    <input 
                      type="number" min="0" required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.sewageCharges}
                      onChange={(e) => setForm({...form, sewageCharges: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Security Charges (₹)</label>
                    <input 
                      type="number" min="0" required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.securityCharges}
                      onChange={(e) => setForm({...form, securityCharges: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">BESCOM (Electricity) (₹)</label>
                    <input 
                      type="number" min="0" required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.bescom}
                      onChange={(e) => setForm({...form, bescom: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">BWSSB (₹)</label>
                    <input 
                      type="number" min="0" required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.bwssb}
                      onChange={(e) => setForm({...form, bwssb: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Petty Cash / Misc (₹)</label>
                    <input 
                      type="number" min="0" required
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={form.miscellaneous}
                      onChange={(e) => setForm({...form, miscellaneous: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-2xl text-white">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Calculation Summary</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Total Maintenance Cost</p>
                    <p className="text-2xl font-bold">₹{calculateTotal().toLocaleString()}</p>
                  </div>
                  <div className="text-right border-l border-slate-700 pl-8">
                    <p className="text-xs text-slate-400 mb-1">Per Flat Allocation ({flats.length} units)</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      ₹{flats.length > 0 ? Math.round(calculateTotal() / flats.length).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
              >
                {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IndianRupee className="w-5 h-5" />}
                {isGenerating ? 'Processing Transactions...' : 'Confirm & Generate All Bills'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;