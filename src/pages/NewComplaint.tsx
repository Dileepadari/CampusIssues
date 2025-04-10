
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ComplaintForm from '@/components/Complaint/ComplaintForm';

const NewComplaint = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status from localStorage (mock auth)
    const authStatus = localStorage.getItem('isAuthenticated');
    const userRole = localStorage.getItem('userRole');
    
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setIsAdmin(userRole === 'admin');
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
    
    setLoading(false);
  }, [navigate]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
      
      <main className="flex-grow py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-6">Submit a Complaint or Feedback</h1>
          <p className="text-gray-600 mb-8">
            Please provide the details of your complaint, feedback, or suggestion. 
            Be as specific as possible to help us address your concern effectively.
          </p>
          
          <ComplaintForm />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NewComplaint;
