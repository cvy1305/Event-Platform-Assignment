import { HiCalendar } from 'react-icons/hi';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <HiCalendar className="h-6 w-6 text-indigo-400" />
            <span className="text-lg font-bold">EventHub</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
