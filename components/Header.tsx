
import React, { useState, useEffect } from 'react';
import { User, Notification, UserRole } from '../types';
import { LogOut, Bell, User as UserIcon } from 'lucide-react';
import { db } from '../db';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = () => {
      setNotifications(db.notifications.getAllForUser(user.id));
    };

    fetchNotifications();
    
    // Set up a simple interval to poll for notifications (simulating real-time)
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = (id: string) => {
    db.notifications.markAsRead(id);
    setNotifications(db.notifications.getAllForUser(user.id));
  };

  const handleMarkAllRead = () => {
    db.notifications.markAllAsRead(user.id);
    setNotifications(db.notifications.getAllForUser(user.id));
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold text-slate-800">Welcome, {user.name}</h2>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
          {user.role === UserRole.ADMIN ? 'Association Manager' : 'Resident Dashboard'}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all ${isDropdownOpen ? 'bg-slate-100 text-slate-600' : ''}`}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          <NotificationDropdown 
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
          />
        </div>
        
        <div className="h-10 w-px bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <UserIcon className="w-5 h-5 text-slate-500" />
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
