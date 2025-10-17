import React from 'react';
import { MagnifyingGlassIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';

// Placeholder data
const queuedCustomers = [
  { id: 1, name: 'Abebe Bikila', service: 'Cash Deposit', time: '10:30 AM' },
  { id: 2, name: 'Fatuma Roba', service: 'Account Opening', time: '10:32 AM' },
  { id: 3, name: 'Haile Gebrselassie', service: 'Fund Transfer', time: '10:35 AM' },
];

const ReceptionistDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h1>
            <p className="text-sm text-gray-500">Branch: Finfine</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-fuchsia-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-fuchsia-700">
              <UserPlusIcon className="h-5 w-5" />
              <span>New Customer</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer Search and Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Lookup</h2>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600"
                />
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                    <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">Issue Queue Ticket</button>
                    <button className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Book Appointment</button>
                </div>
            </div>
          </div>

          {/* Right Column: Queued Customers */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <UsersIcon className="h-6 w-6 text-gray-500" />
                    <span>Waiting Customers</span>
                </h2>
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{queuedCustomers.length}</span>
            </div>
            <ul className="divide-y divide-gray-200">
              {queuedCustomers.map((customer) => (
                <li key={customer.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{customer.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
