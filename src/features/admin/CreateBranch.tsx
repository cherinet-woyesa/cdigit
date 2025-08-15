import axios from 'axios';
import React, { useState } from 'react';

const CreateBranch: React.FC = () => {
  const [branchName, setBranchName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post('/api/branches', { branchName });
      setMessage(response.data.Message || 'Branch created successfully!');
      setBranchName('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create branch.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-fuchsia-700 mb-6">Create Branch</h1>
        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">Branch Name</label>
            <input
              type="text"
              id="branchName"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-fuchsia-600 text-white py-2 px-4 rounded-md hover:bg-fuchsia-700"
          >
            Create Branch
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBranch;
