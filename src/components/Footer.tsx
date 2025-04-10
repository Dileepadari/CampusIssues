
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="text-brand-blue font-bold text-xl">CampusFeedback</Link>
            <p className="mt-2 text-sm text-gray-600">
              A centralized platform for students to submit complaints, 
              feedback, and suggestions to improve campus life.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-brand-blue">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-brand-blue">
                  My Complaints
                </Link>
              </li>
              <li>
                <Link to="/new-complaint" className="text-sm text-gray-600 hover:text-brand-blue">
                  Submit Feedback
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Help</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-brand-blue">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-brand-blue">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-brand-blue">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6 mt-8 text-center">
          <p className="text-sm text-gray-600">
            &copy; {year} Campus Feedback Portal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
