
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Calendar, Clock, Paperclip, Send } from 'lucide-react';
import { Complaint, ComplaintResponse } from '@/lib/types';
import { format } from 'date-fns';

const ViewComplaint = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check authentication status from localStorage (mock auth)
    const authStatus = localStorage.getItem('isAuthenticated');
    const userRole = localStorage.getItem('userRole');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setIsAdmin(userRole === 'admin');
      
      // Fetch complaint data (mock data for demo)
      setTimeout(() => {
        // This would be an API call to your backend in a real app
        const mockComplaint: Complaint = {
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
              message: 'We are aware of the issue and have contacted our IT department to investigate. They will be performing maintenance on the library network infrastructure next week.',
              createdAt: '2023-04-07T14:20:00',
              userId: 'admin1',
              userName: 'IT Support',
              isAdmin: true
            }
          ]
        };
        
        setComplaint(mockComplaint);
        setLoading(false);
      }, 1000);
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [id, navigate]);

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      // This would be an API call to your backend in a real app
      setTimeout(() => {
        const newResponse: ComplaintResponse = {
          id: `resp${Date.now()}`,
          complaintId: complaint?.id || '',
          message: responseText,
          createdAt: new Date().toISOString(),
          userId: 'current-user',
          userName: isAdmin ? 'Admin User' : 'John Doe',
          isAdmin: isAdmin
        };
        
        setComplaint((prev) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            responses: [...(prev.responses || []), newResponse]
          };
        });
        
        setResponseText('');
        setSuccess('Response submitted successfully!');
        
        // Clear success message after a few seconds
        setTimeout(() => setSuccess(''), 3000);
      }, 1000);
    } catch (err) {
      setError('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = (newStatus: 'pending' | 'in-progress' | 'resolved' | 'rejected') => {
    if (!isAdmin || !complaint) return;
    
    // This would be an API call to your backend in a real app
    setComplaint({
      ...complaint,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    setSuccess(`Status updated to "${newStatus}"`);
    
    // Clear success message after a few seconds
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-xl">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-xl text-red-500">Complaint not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  // Format dates
  const formattedCreatedDate = format(new Date(complaint.createdAt), 'MMM d, yyyy h:mm a');
  const formattedUpdatedDate = format(new Date(complaint.updatedAt), 'MMM d, yyyy h:mm a');

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'complaint-status-pending';
      case 'in-progress':
        return 'complaint-status-in-progress';
      case 'resolved':
        return 'complaint-status-resolved';
      case 'rejected':
        return 'complaint-status-rejected';
      default:
        return 'complaint-status-pending';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              &larr; Back
            </Button>
            
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{complaint.title}</h1>
                <p className="text-gray-500 mt-1">
                  Tracking ID: <span className="font-mono">{complaint.trackingId}</span>
                </p>
              </div>
              <div className={getStatusClass(complaint.status)}>
                {complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
              </div>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <div className="flex items-center">
                  {complaint.isAnonymous ? (
                    <Avatar>
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar>
                      <AvatarFallback>
                        {complaint.userName?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="ml-4">
                    <p className="font-medium">
                      {complaint.isAnonymous ? 'Anonymous User' : complaint.userName}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formattedCreatedDate}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{complaint.description}</p>
              
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center mb-2">
                    <Paperclip className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-sm font-medium">Attachments</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {complaint.attachments.map((attachment, index) => (
                      <Badge key={index} variant="secondary">
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {isAdmin && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={complaint.status === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('pending')}
                    >
                      Pending
                    </Button>
                    <Button 
                      variant={complaint.status === 'in-progress' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('in-progress')}
                    >
                      In Progress
                    </Button>
                    <Button 
                      variant={complaint.status === 'resolved' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('resolved')}
                    >
                      Resolved
                    </Button>
                    <Button 
                      variant={complaint.status === 'rejected' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('rejected')}
                    >
                      Rejected
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Responses</h2>
            {complaint.responses && complaint.responses.length > 0 ? (
              <div className="space-y-4">
                {complaint.responses.map((response) => (
                  <Card key={response.id} className={`${response.isAdmin ? 'bg-blue-50/50 border-blue-100' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start">
                        <Avatar>
                          <AvatarFallback>
                            {response.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {response.userName}
                              {response.isAdmin && (
                                <Badge variant="outline" className="ml-2 text-xs">Staff</Badge>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(response.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap">{response.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No responses yet</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Response</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleResponseSubmit} className="space-y-4">
                <Textarea
                  placeholder="Write your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  required
                  className="resize-y"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ViewComplaint;
