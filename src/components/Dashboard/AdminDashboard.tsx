
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Complaint } from '@/lib/types';
import ComplaintList from '@/components/Complaint/ComplaintList';
import DashboardStats from './DashboardStats';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const AdminDashboard = () => {
  // Mock data - would come from backend in real app
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: '1',
      trackingId: 'TRK123456',
      title: 'Poor Wi-Fi in Library',
      description: 'The Wi-Fi connection in the library is extremely slow during peak hours, making it difficult to access online resources for research.',
      category: 'infrastructure',
      status: 'in-progress',
      createdAt: '2023-04-05T10:30:00',
      updatedAt: '2023-04-07T14:20:00',
      isAnonymous: false,
      userId: 'user1',
      userName: 'John Doe',
      responses: [
        {
          id: 'resp1',
          complaintId: '1',
          message: 'We are aware of the issue and have contacted our IT department to investigate.',
          createdAt: '2023-04-07T14:20:00',
          userId: 'admin1',
          userName: 'Admin',
          isAdmin: true
        }
      ]
    },
    {
      id: '2',
      trackingId: 'TRK789012',
      title: 'Inadequate Parking Space',
      description: 'There is insufficient parking space on campus, especially during events. Many students are forced to park far away or in unauthorized areas.',
      category: 'infrastructure',
      status: 'pending',
      createdAt: '2023-04-08T09:15:00',
      updatedAt: '2023-04-08T09:15:00',
      isAnonymous: true,
      attachments: ['parking_photo.jpg']
    },
    {
      id: '3',
      trackingId: 'TRK345678',
      title: 'Course Material Not Updated',
      description: 'The course materials for CS301 are outdated. The textbook references software versions that are no longer used in industry.',
      category: 'academics',
      status: 'resolved',
      createdAt: '2023-03-20T13:45:00',
      updatedAt: '2023-03-28T11:30:00',
      isAnonymous: false,
      userId: 'user1',
      userName: 'John Doe',
      responses: [
        {
          id: 'resp2',
          complaintId: '3',
          message: 'Thank you for bringing this to our attention. We have updated the course materials with current references and examples.',
          createdAt: '2023-03-28T11:30:00',
          userId: 'admin2',
          userName: 'Department Head',
          isAdmin: true
        }
      ]
    },
    {
      id: '4',
      trackingId: 'TRK901234',
      title: 'Cafeteria Food Quality',
      description: 'The quality of food in the main cafeteria has deteriorated. There are limited healthy options and the food is often served cold.',
      category: 'canteen',
      status: 'pending',
      createdAt: '2023-04-10T12:20:00',
      updatedAt: '2023-04-10T12:20:00',
      isAnonymous: true
    },
    {
      id: '5',
      trackingId: 'TRK567890',
      title: 'Broken Equipment in Physics Lab',
      description: 'Several pieces of equipment in the Physics Lab 2 are not functioning properly, affecting our ability to complete experiments.',
      category: 'infrastructure',
      status: 'pending',
      createdAt: '2023-04-09T15:45:00',
      updatedAt: '2023-04-09T15:45:00',
      isAnonymous: false,
      userId: 'user2',
      userName: 'Jane Smith',
      attachments: ['broken_equipment.jpg']
    },
    {
      id: '6',
      trackingId: 'TRK234567',
      title: 'Late Grade Submission',
      description: 'Grades for the midterm exam in ECO202 were promised to be released last week but still haven\'t been posted.',
      category: 'academics',
      status: 'resolved',
      createdAt: '2023-03-25T10:00:00',
      updatedAt: '2023-04-01T09:30:00',
      isAnonymous: false,
      userId: 'user3',
      userName: 'Michael Johnson',
      responses: [
        {
          id: 'resp3',
          complaintId: '6',
          message: 'We apologize for the delay. The grades have now been posted to the student portal.',
          createdAt: '2023-04-01T09:30:00',
          userId: 'admin3',
          userName: 'Economics Department',
          isAdmin: true
        }
      ]
    },
    {
      id: '7',
      trackingId: 'TRK678901',
      title: 'Hostel Water Supply Issues',
      description: 'There has been no water supply in Block C of the men\'s hostel for the past 2 days.',
      category: 'hostel',
      status: 'in-progress',
      createdAt: '2023-04-11T08:10:00',
      updatedAt: '2023-04-11T14:30:00',
      isAnonymous: false,
      userId: 'user4',
      userName: 'Robert Wilson',
      responses: [
        {
          id: 'resp4',
          complaintId: '7',
          message: 'We have identified a main pipe issue and maintenance team is working on it. Should be resolved by tomorrow.',
          createdAt: '2023-04-11T14:30:00',
          userId: 'admin4',
          userName: 'Hostel Admin',
          isAdmin: true
        }
      ]
    }
  ]);

  // Calculate stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length
  };

  // Data for category distribution chart
  const categoryData = [
    { name: 'Academics', value: complaints.filter(c => c.category === 'academics').length },
    { name: 'Faculty', value: complaints.filter(c => c.category === 'faculty').length },
    { name: 'Infrastructure', value: complaints.filter(c => c.category === 'infrastructure').length },
    { name: 'Hostel', value: complaints.filter(c => c.category === 'hostel').length },
    { name: 'Canteen', value: complaints.filter(c => c.category === 'canteen').length },
    { name: 'Transport', value: complaints.filter(c => c.category === 'transport').length },
    { name: 'Other', value: complaints.filter(c => c.category === 'other').length },
  ].filter(item => item.value > 0);

  // Data for status distribution chart
  const statusData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Resolved', value: stats.resolved, color: '#10b981' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Complaints by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Number of Complaints" fill="#0056D2" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} complaints`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      <Card>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="p-4">
            <ComplaintList complaints={complaints} isAdmin={true} />
          </TabsContent>
          <TabsContent value="pending" className="p-4">
            <ComplaintList complaints={complaints.filter(c => c.status === 'pending')} isAdmin={true} />
          </TabsContent>
          <TabsContent value="in-progress" className="p-4">
            <ComplaintList complaints={complaints.filter(c => c.status === 'in-progress')} isAdmin={true} />
          </TabsContent>
          <TabsContent value="resolved" className="p-4">
            <ComplaintList complaints={complaints.filter(c => c.status === 'resolved')} isAdmin={true} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminDashboard;
