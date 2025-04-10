
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Complaint } from '@/lib/types';
import ComplaintList from '@/components/Complaint/ComplaintList';
import DashboardStats from './DashboardStats';
import { CheckCircle, Link, PlusCircle } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const StudentDashboard = () => {
  // Check for success message from location state (e.g., after submission)
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(
    location.state?.success ? location.state.message : null
  );

  // Mock data - would come from backend in real app
  const [complaints, setComplaints] = useState<Complaint[]>([
    {
      id: '1',
      trackingId: 'TRK123456',
      title: 'Poor Wi-Fi in Library',
      description: 'The Wi-Fi connection in the library is extremely slow during peak hours, making it difficult to access online resources for research. This has been an ongoing issue for the past month.',
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
    }
  ]);

  // Clear success message after showing
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Calculate stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    rejected: complaints.filter(c => c.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Your Complaints</h1>
        <RouterLink to="/new-complaint">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Complaint
          </Button>
        </RouterLink>
      </div>
      
      <DashboardStats stats={stats} />
      
      <Card>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="p-4">
            <ComplaintList complaints={complaints} />
          </TabsContent>
          <TabsContent value="pending" className="p-4">
            <ComplaintList complaints={complaints.filter(c => c.status === 'pending')} />
          </TabsContent>
          <TabsContent value="in-progress" className="p-4">
            <ComplaintList complaints={complaints.filter(c => c.status === 'in-progress')} />
          </TabsContent>
          <TabsContent value="resolved" className="p-4">
            <ComplaintList complaints={complaints.filter(c => c.status === 'resolved')} />
          </TabsContent>
        </Tabs>
      </Card>
      
      <Card className="p-6 bg-muted/30">
        <div className="flex items-center space-x-2">
          <Link className="h-5 w-5" />
          <h2 className="text-lg font-medium">Quick Access</h2>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Want to check the status of a complaint without logging in? Use the tracking ID.
        </p>
        <RouterLink to="/" className="mt-4 inline-block">
          <Button variant="outline">Track Complaint Status</Button>
        </RouterLink>
      </Card>
    </div>
  );
};

export default StudentDashboard;
