
import React from 'react';
import { Notification, NotificationType } from '../types';
import { Bell, Check, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications, 
  onMarkRead, 
  onMarkAllRead, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case NotificationType.ALERT: return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case NotificationType.BILLING: return <Info className="w-4 h-4 text-amber-500" />;
      case NotificationType.COMPLAINT: return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
          <button 
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-4 hover:bg-slate-50 transition-colors flex gap-3 relative group ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {!n.isRead && (
                    <button 
                      onClick={() => onMarkRead(n.id)}
                      className="absolute top-4 right-4 p-1 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  {!n.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full"></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button className="text-xs font-bold text-slate-500 hover:text-slate-800">View All Activity</button>
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
