
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  department?: string;
  studentId?: string;
};

export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved' | 'rejected';

export type ComplaintCategory = 
  | 'academics' 
  | 'faculty' 
  | 'infrastructure' 
  | 'hostel' 
  | 'canteen' 
  | 'transport' 
  | 'other';

export type Complaint = {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  isAnonymous: boolean;
  userId?: string;
  userName?: string;
  attachments?: string[];
  responses?: ComplaintResponse[];
};

export type ComplaintResponse = {
  id: string;
  complaintId: string;
  message: string;
  createdAt: string;
  userId: string;
  userName: string;
  isAdmin: boolean;
};

export type ComplaintStats = {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
};
