import React from "react";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-white border-t border-gray-200 text-center py-3">
      <p className="text-xs text-gray-600">
        &copy; {year} Commercial Bank of Ethiopia. All Rights Reserved.
      </p>
      <p className="text-xs text-gray-500 italic mt-0.5">
        "Committed to Your Progress"
      </p>
    </footer>
  );
};

export default Footer;