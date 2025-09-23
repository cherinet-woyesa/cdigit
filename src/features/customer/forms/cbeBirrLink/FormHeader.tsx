import React from 'react';

interface FormHeaderProps {
  title: string;
  branchName: string;
  currentDate: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({ title, branchName, currentDate }) => (
  <div className="text-center mb-8 bg-fuchsia-700 text-white p-4 rounded-lg shadow-lg">
    <h1 className="text-3xl font-extrabold text-white">{title}</h1>
    <div className="flex flex-col md:flex-row justify-center items-center gap-2 mt-2">
      <span className="text-white">{branchName}</span>
      <span className="hidden md:inline-block text-white">|</span>
      <span className="text-white">{currentDate}</span>
    </div>
  </div>
);

export default FormHeader;
