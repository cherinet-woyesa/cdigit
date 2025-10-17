import React from 'react';
import { CalendarIcon, ClockIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const VipBooking: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">VIP Pre-Booking</h1>
          <p className="text-gray-600">Welcome, valued corporate client. Please book your priority appointment.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <select id="branch" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600">
                <option>Head Office - Financial District</option>
                <option>Metropolis Branch</option>
                <option>Industrial Area Branch</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="date" id="date" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600" />
            </div>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="time" id="time" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-600" />
            </div>
          </div>

          <button className="w-full bg-fuchsia-600 text-white px-4 py-3 rounded-lg hover:bg-fuchsia-700 transition-all">
            Book Appointment
          </button>

          <p className="text-xs text-gray-400 text-center">
            This is a placeholder UI. In a real application, this would be integrated with a booking system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VipBooking;
