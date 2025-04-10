
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  MenuIcon, 
  X, 
  LogIn, 
  UserPlus, 
  Home, 
  FileText, 
  PlusCircle 
} from 'lucide-react';

interface NavbarProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  isAuthenticated = false,
  isAdmin = false 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
              <span className="text-brand-blue font-bold text-xl">CampusFeedback</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/">
                  <Button variant="ghost" 
                    className={location.pathname === '/' ? 'bg-primary/10' : ''}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" 
                    className={location.pathname === '/dashboard' ? 'bg-primary/10' : ''}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    My Complaints
                  </Button>
                </Link>
                <Link to="/new-complaint">
                  <Button variant="ghost" 
                    className={location.pathname === '/new-complaint' ? 'bg-primary/10' : ''}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Complaint
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" 
                      className={location.pathname === '/admin' ? 'bg-primary/10' : ''}
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="default" onClick={() => console.log('Logout')}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/">
                  <Button variant="ghost" 
                    className={location.pathname === '/' ? 'bg-primary/10' : ''}
                  >
                    Home
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t py-2 px-4 space-y-2">
          <Link to="/" className="block p-2 hover:bg-gray-50 rounded-lg" onClick={closeMobileMenu}>
            Home
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="block p-2 hover:bg-gray-50 rounded-lg" onClick={closeMobileMenu}>
                My Complaints
              </Link>
              <Link to="/new-complaint" className="block p-2 hover:bg-gray-50 rounded-lg" onClick={closeMobileMenu}>
                New Complaint
              </Link>
              {isAdmin && (
                <Link to="/admin" className="block p-2 hover:bg-gray-50 rounded-lg" onClick={closeMobileMenu}>
                  Admin Dashboard
                </Link>
              )}
              <Button variant="default" className="w-full mt-2" onClick={() => console.log('Logout')}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="block p-2 hover:bg-gray-50 rounded-lg" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/signup" className="block p-2 hover:bg-gray-50 rounded-lg" onClick={closeMobileMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
