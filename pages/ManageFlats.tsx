import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Flat, User, UserRole } from '../types';
import { Plus, Search, Edit3, Building2, UserCircle2, Trash2, X, Check, Lock, Phone, Mail, User as UserIcon } from 'lucide-react';

const ManageFlats: React.FC = () => {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlat, setEditingFlat] = useState<Flat | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Combined Form State
  const [formData, setFormData] = useState({
    unitNumber: '',
    floor: '',
    resName: '',
    resPhone: '',
    resEmail: '',
    resPassword: '',
    isOccupied: false
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const allFlats = db.flats.getAll();
    const allUsers = db.users.getAll();
    // Use spread to ensure React detects a new array reference and re-renders
    setFlats([...allFlats]);
    setUsers([...allUsers]);
  };

  const openAddModal = () => {
    setEditingFlat(null);
    setEditingUser(null);
    setFormData({ 
      unitNumber: '', 
      floor: '', 
      resName: '', 
      resPhone: '', 
      resEmail: '', 
      resPassword: 'password123', 
      isOccupied: false 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (flat: Flat) => {
    const resident = users.find(u => u.id === flat.residentId);
    setEditingFlat(flat);
    setEditingUser(resident || null);
    setFormData({ 
      unitNumber: flat.unitNumber, 
      floor: flat.floor, 
      resName: resident?.name || '', 
      resPhone: resident?.phone || '', 
      resEmail: resident?.email || '', 
      resPassword: '', 
      isOccupied: !!resident 
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to clear resident info? The resident account will be deleted and this flat will become vacant, but the unit will remain in your list.')) {
      db.flats.delete(id);
      refreshData();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let residentId = editingUser?.id;

    if (formData.isOccupied) {
      const userData: User = {
        id: editingUser ? editingUser.id : `u-${Date.now()}`,
        name: formData.resName,
        phone: formData.resPhone,
        email: formData.resEmail,
        role: UserRole.RESIDENT,
        flatId: editingFlat ? editingFlat.id : `f-${Date.now()}`,
        password: formData.resPassword || editingUser?.password || 'password123'
      };

      if (editingUser) {
        db.users.update(userData);
      } else {
        db.users.create(userData);
        residentId = userData.id;
      }
    } else {
      if (editingUser) {
        db.users.delete(editingUser.id);
      }
      residentId = undefined;
    }

    const flatId = editingFlat ? editingFlat.id : `f-${Date.now()}`;
    const flatData: Flat = {
      id: flatId,
      unitNumber: formData.unitNumber,
      floor: formData.floor,
      residentId: residentId,
      status: residentId ? 'OCCUPIED' : 'VACANT'
    };

    if (editingFlat) {
      db.flats.update(flatData);
    } else {
      db.flats.create(flatData);
    }

    if (residentId) {
      const user = db.users.getById(residentId);
      if (user) {
        db.users.update({ ...user, flatId: flatId });
      }
    }

    setIsModalOpen(false);
    refreshData();
  };

  const filteredFlats = flats.filter(f => 
    f.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apartment Units</h1>
          <p className="text-slate-500">Manage all units and resident login credentials.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-100 transition-all font-bold flex items-center gap-2 w-fit"
        >
          <Plus className="w-5 h-5" />
          Add New Flat
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative mb-6">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by unit number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-4">Flat Info</th>
                <th className="px-4 py-4">Resident Info</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFlats.map(f => {
                const resident = users.find(u => u.id === f.residentId);
                return (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">Unit {f.unitNumber}</p>
                          <p className="text-xs text-slate-500">Floor {f.floor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {resident ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <UserCircle2 className="w-4 h-4 text-slate-400" />
                            {resident.name}
                          </div>
                          {resident.phone && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Phone className="w-3 h-3 text-slate-300" />
                              {resident.phone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">None Assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        f.status === 'OCCUPIED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(f)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit Flat & Resident"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(f.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Clear Resident Info"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFlats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic">
                    No flats found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-900">
                {editingFlat ? `Edit Unit ${editingFlat.unitNumber}` : 'Add New Flat'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" /> Unit Number
                  </label>
                  <input 
                    type="text"
                    required
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({...formData, unitNumber: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Floor</label>
                  <input 
                    type="text"
                    required
                    value={formData.floor}
                    onChange={(e) => setFormData({...formData, floor: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-indigo-500" /> Resident Management
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.isOccupied}
                      onChange={(e) => setFormData({...formData, isOccupied: e.target.checked})}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-sm font-semibold text-slate-600">Unit Occupied</span>
                  </label>
                </div>

                {formData.isOccupied ? (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resident Full Name</label>
                        <input 
                          type="text"
                          required={formData.isOccupied}
                          value={formData.resName}
                          onChange={(e) => setFormData({...formData, resName: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> Phone Number
                        </label>
                        <input 
                          type="tel"
                          required={formData.isOccupied}
                          value={formData.resPhone}
                          onChange={(e) => setFormData({...formData, resPhone: e.target.value})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g. 9876543210"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Resident Login Credentials
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Login Email</label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                              type="email"
                              required={formData.isOccupied}
                              value={formData.resEmail}
                              onChange={(e) => setFormData({...formData, resEmail: e.target.value})}
                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              placeholder="login@email.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            {editingUser ? 'Reset Password' : 'Initial Password'}
                          </label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              required={!editingUser && formData.isOccupied}
                              value={formData.resPassword}
                              onChange={(e) => setFormData({...formData, resPassword: e.target.value})}
                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                              placeholder={editingUser ? "Leave blank to keep same" : "e.g. pass123"}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400 italic">No resident assigned. This flat will be marked as VACANT.</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex-shrink-0">
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100"
                >
                  <Check className="w-5 h-5" /> 
                  {editingFlat ? 'Save Flat & Resident Info' : 'Create Flat & Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFlats;