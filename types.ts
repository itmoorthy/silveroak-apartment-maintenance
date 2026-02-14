
export enum UserRole {
  ADMIN = 'ADMIN',
  RESIDENT = 'RESIDENT'
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED'
}

export enum BillStatus {
  PAID = 'PAID',
  PENDING = 'PENDING'
}

export enum NotificationType {
  INFO = 'INFO',
  ALERT = 'ALERT',
  SUCCESS = 'SUCCESS',
  BILLING = 'BILLING',
  COMPLAINT = 'COMPLAINT'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  flatId?: string;
  password?: string;
}

export interface Flat {
  id: string;
  unitNumber: string;
  floor: string;
  residentId?: string;
  status: 'OCCUPIED' | 'VACANT';
}

export interface MaintenanceMaster {
  id: string;
  month: string;
  year: number;
  waterCharges: number;
  sewageCharges: number;
  securityCharges: number;
  bescom: number;
  bwssb: number;
  pettyCash: number;
  miscellaneous: number;
  totalAmount: number;
  perFlatAmount: number;
  createdAt: string;
}

export interface MaintenanceBill {
  id: string;
  masterId?: string; // Foreign key to MaintenanceMaster
  flatId: string;
  month: string;
  year: number;
  amount: number;
  status: BillStatus;
  createdAt: string;
}

export interface Complaint {
  id: string;
  flatId: string;
  residentId: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  comments: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
