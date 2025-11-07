// Simple Footer component
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="text-center text-sm text-gray-600">
        © {new Date().getFullYear()} CBE Forms. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
