
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, CheckCircle, RefreshCw, MessageSquare, LockIcon, BarChart3 } from 'lucide-react';

const Index = () => {
  const [trackingId, setTrackingId] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      console.log('Searching for tracking ID:', trackingId);
      setSearchSubmitted(true);
      // In a real app, this would connect to your backend
    }
  };

  const features = [
    {
      icon: <MessageSquare className="h-10 w-10 text-brand-blue" />,
      title: 'Submit Feedback',
      description: 'Easily submit complaints, feedback, or suggestions about any aspect of campus life.'
    },
    {
      icon: <RefreshCw className="h-10 w-10 text-brand-blue" />,
      title: 'Track Progress',
      description: 'Monitor the status of your submissions with a unique tracking ID.'
    },
    {
      icon: <CheckCircle className="h-10 w-10 text-brand-blue" />,
      title: 'Get Resolution',
      description: 'Receive responses and solutions from the relevant departments.'
    },
    {
      icon: <LockIcon className="h-10 w-10 text-brand-blue" />,
      title: 'Stay Anonymous',
      description: 'Submit feedback anonymously if you prefer to keep your identity confidential.'
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-brand-blue" />,
      title: 'View Insights',
      description: 'Access statistics about campus issues and resolution rates.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-brand-blue to-blue-500 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center">
              <div className="md:w-1/2 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold text-white">
                  Campus Feedback Portal
                </h1>
                <p className="mt-3 text-xl text-white/90">
                  A centralized platform for students to submit complaints, 
                  feedback, and suggestions to improve campus life.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto">
                      Login to Submit
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 w-full sm:w-auto">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="md:w-1/2 mt-10 md:mt-0">
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">
                      Track Your Complaint
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Enter the tracking ID provided when you submitted your complaint
                    </p>
                    <form onSubmit={handleSearch}>
                      <div className="flex space-x-4">
                        <div className="relative flex-grow">
                          <Search className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Enter tracking ID (e.g., TRK123456)"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Button type="submit">
                          Track
                        </Button>
                      </div>
                    </form>
                    
                    {searchSubmitted && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-center text-gray-600">
                          No results found for tracking ID: {trackingId}
                        </p>
                        <p className="text-center text-sm mt-1 text-gray-500">
                          Please check the ID and try again, or contact support.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="mt-4 text-xl text-gray-600">
                Our platform provides a seamless experience for addressing campus issues
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col items-center p-6">
                    <div className="rounded-full p-3 bg-blue-50 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-gray py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold">Ready to Share Your Feedback?</h2>
            <p className="mt-4 text-xl text-gray-600">
              Join our community of students working together to improve campus life
            </p>
            <div className="mt-8">
              <Link to="/signup">
                <Button size="lg">Get Started Today</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
