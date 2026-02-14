
import React from 'react';
import { UserRole } from '../types';
import { LayoutDashboard, Building2, ReceiptIndianRupee, MessageSquareWarning, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, currentPage, onNavigate }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.RESIDENT] },
    { id: 'flats', label: 'Flats & Residents', icon: Building2, roles: [UserRole.ADMIN] },
    { id: 'billing', label: 'Maintenance Bills', icon: ReceiptIndianRupee, roles: [UserRole.ADMIN, UserRole.RESIDENT] },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning, roles: [UserRole.ADMIN, UserRole.RESIDENT] },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">SilverOak</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems
          .filter(item => item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div className="p-4 m-4 bg-slate-800/50 rounded-2xl">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Support</p>
        <p className="text-sm text-slate-300">Need help? Contact the association office.</p>
      </div>
    </div>
  );
};

export default Sidebar;
