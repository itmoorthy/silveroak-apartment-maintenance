import { User, Flat, MaintenanceBill, MaintenanceMaster, Complaint, UserRole, BillStatus, ComplaintStatus, Notification, NotificationType } from './types';

const STORAGE_KEYS = {
  USERS: 'silveroak_users',
  FLATS: 'silveroak_flats',
  BILLS: 'silveroak_bills',
  MASTERS: 'silveroak_masters',
  COMPLAINTS: 'silveroak_complaints',
  NOTIFICATIONS: 'silveroak_notifications'
};

const seedData = {
  users: [
    { id: 'u1', name: 'Admin User', email: 'admin@silveroak.com', password: 'pass123', role: UserRole.ADMIN },
    { id: 'u2', name: 'John Doe', email: 'john@gmail.com', phone: '9876543210', password: 'password123', role: UserRole.RESIDENT, flatId: 'f1' },
    { id: 'u3', name: 'Jane Smith', email: 'jane@gmail.com', phone: '9123456789', password: 'password123', role: UserRole.RESIDENT, flatId: 'f2' }
  ],
  flats: [
    { id: 'f1', unitNumber: '101', floor: '1', residentId: 'u2', status: 'OCCUPIED' },
    { id: 'f2', unitNumber: '102', floor: '1', residentId: 'u3', status: 'OCCUPIED' },
    { id: 'f3', unitNumber: '201', floor: '2', residentId: undefined, status: 'VACANT' },
    { id: 'f4', unitNumber: '202', floor: '2', residentId: undefined, status: 'VACANT' }
  ],
  bills: [],
  masters: [],
  complaints: [],
  notifications: [
    {
      id: 'n1',
      userId: 'u2',
      title: 'Welcome to SilverOak',
      message: 'Your resident account has been successfully created.',
      type: NotificationType.SUCCESS,
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ]
};

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing ${key} from storage:`, e);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize DB only if not already present
if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
  saveToStorage(STORAGE_KEYS.USERS, seedData.users);
  saveToStorage(STORAGE_KEYS.FLATS, seedData.flats);
  saveToStorage(STORAGE_KEYS.BILLS, seedData.bills);
  saveToStorage(STORAGE_KEYS.MASTERS, seedData.masters);
  saveToStorage(STORAGE_KEYS.COMPLAINTS, seedData.complaints);
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, seedData.notifications);
}

export const db = {
  users: {
    getAll: () => getFromStorage<User[]>(STORAGE_KEYS.USERS, []),
    getById: (id: string) => getFromStorage<User[]>(STORAGE_KEYS.USERS, []).find(u => u.id === id),
    getByEmail: (email: string) => getFromStorage<User[]>(STORAGE_KEYS.USERS, []).find(u => u.email === email),
    create: (user: User) => {
      const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
      users.push(user);
      saveToStorage(STORAGE_KEYS.USERS, users);
    },
    update: (updatedUser: User) => {
      const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
      const index = users.findIndex(u => u.id === updatedUser.id);
      if (index > -1) {
        users[index] = { ...users[index], ...updatedUser };
        saveToStorage(STORAGE_KEYS.USERS, users);
      }
    },
    delete: (id: string) => {
      const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []).filter(u => u.id !== id);
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
  },
  flats: {
    getAll: () => getFromStorage<Flat[]>(STORAGE_KEYS.FLATS, []),
    update: (updatedFlat: Flat) => {
      const flats = getFromStorage<Flat[]>(STORAGE_KEYS.FLATS, []);
      const index = flats.findIndex(f => f.id === updatedFlat.id);
      if (index > -1) {
        flats[index] = updatedFlat;
        saveToStorage(STORAGE_KEYS.FLATS, flats);
      }
    },
    create: (flat: Flat) => {
      const flats = getFromStorage<Flat[]>(STORAGE_KEYS.FLATS, []);
      flats.push(flat);
      saveToStorage(STORAGE_KEYS.FLATS, flats);
    },
    delete: (id: string) => {
      const flats = getFromStorage<Flat[]>(STORAGE_KEYS.FLATS, []);
      const flatIndex = flats.findIndex(f => f.id === id);
      if (flatIndex > -1) {
        const residentId = flats[flatIndex].residentId;
        if (residentId) {
          const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
          saveToStorage(STORAGE_KEYS.USERS, users.filter(u => u.id !== residentId));
        }
        flats[flatIndex].residentId = undefined;
        flats[flatIndex].status = 'VACANT';
        saveToStorage(STORAGE_KEYS.FLATS, flats);
      }
    }
  },
  maintenanceMasters: {
    getAll: () => getFromStorage<MaintenanceMaster[]>(STORAGE_KEYS.MASTERS, []),
    create: (master: MaintenanceMaster) => {
      const masters = getFromStorage<MaintenanceMaster[]>(STORAGE_KEYS.MASTERS, []);
      masters.push(master);
      saveToStorage(STORAGE_KEYS.MASTERS, masters);
    },
    exists: (month: string, year: number) => {
      const masters = getFromStorage<MaintenanceMaster[]>(STORAGE_KEYS.MASTERS, []);
      return masters.some(m => m.month === month && m.year === year);
    }
  },
  bills: {
    getAll: () => getFromStorage<MaintenanceBill[]>(STORAGE_KEYS.BILLS, []),
    create: (bill: MaintenanceBill) => {
      const bills = getFromStorage<MaintenanceBill[]>(STORAGE_KEYS.BILLS, []);
      bills.push(bill);
      saveToStorage(STORAGE_KEYS.BILLS, bills);
    },
    updateStatus: (id: string, status: BillStatus) => {
      const bills = getFromStorage<MaintenanceBill[]>(STORAGE_KEYS.BILLS, []);
      const index = bills.findIndex(b => b.id === id);
      if (index > -1) {
        bills[index].status = status;
        saveToStorage(STORAGE_KEYS.BILLS, bills);
      }
    }
  },
  complaints: {
    getAll: () => getFromStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []),
    create: (complaint: Complaint) => {
      const complaints = getFromStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
      complaints.push(complaint);
      saveToStorage(STORAGE_KEYS.COMPLAINTS, complaints);
    },
    updateStatus: (id: string, status: ComplaintStatus, comment?: string) => {
      const complaints = getFromStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
      const index = complaints.findIndex(c => c.id === id);
      if (index > -1) {
        complaints[index].status = status;
        if (comment) complaints[index].comments.push(comment);
        saveToStorage(STORAGE_KEYS.COMPLAINTS, complaints);
      }
    }
  },
  notifications: {
    getAll: () => getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []),
    getAllForUser: (userId: string) => getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(n => n.userId === userId),
    create: (notification: Notification) => {
      const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      notifications.unshift(notification);
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    },
    markAsRead: (id: string) => {
      const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      const index = notifications.findIndex(n => n.id === id);
      if (index > -1) {
        notifications[index].isRead = true;
        saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
      }
    },
    markAllAsRead: (userId: string) => {
      const notifications = getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
      notifications.forEach(n => {
        if (n.userId === userId) n.isRead = true;
      });
      saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  }
};