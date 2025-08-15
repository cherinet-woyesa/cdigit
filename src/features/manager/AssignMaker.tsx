import React, { useState } from 'react';

const AssignMaker: React.FC = () => {
  const [makerId, setMakerId] = useState('');
  const [windowId, setWindowId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // Simulate API call
      setMessage('Maker assigned to window successfully!');
      setMakerId('');
      setWindowId('');
    } catch (err) {
      setError('Failed to assign maker to window.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-fuchsia-700 mb-6">Assign Maker to Window</h1>
        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="makerId" className="block text-sm font-medium text-gray-700">Maker ID</label>
            <input
              type="text"
              id="makerId"
              value={makerId}
              onChange={(e) => setMakerId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
              required
            />
          </div>
          <div>
            <label htmlFor="windowId" className="block text-sm font-medium text-gray-700">Window ID</label>
            <input
              type="text"
              id="windowId"
              value={windowId}
              onChange={(e) => setWindowId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-fuchsia-500 focus:border-fuchsia-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-fuchsia-600 text-white py-2 px-4 rounded-md hover:bg-fuchsia-700"
          >
            Assign Maker
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssignMaker;
