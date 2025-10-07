import React from "react";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-purple-900 text-purple-200 text-center py-4 mt-auto shadow-inner">
      <p>&copy; {year} Commercial Bank of Ethiopia. All Rights Reserved.</p>
      <p className="text-xs italic">"Committed to Your Progress"</p>
    </footer>
  );
};

export default Footer;