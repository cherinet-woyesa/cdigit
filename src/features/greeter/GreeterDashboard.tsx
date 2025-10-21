import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Phone, 
  Mail,
  UserPlus,
  Calendar,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react';

const GreeterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'customers' | 'schedule'>('queue');

  // Mock data for dashboard
  const queueStats = {
    waitingCustomers: 12,
    avgWaitTime: 8,
    servedToday: 42,
    peakHours: '10:00 - 11:00 AM'
  };

  const waitingCustomers = [
    { id: 1, name: 'John Doe', service: 'Account Opening', waitTime: 5, priority: 'Normal' },
    { id: 2, name: 'Jane Smith', service: 'Fund Transfer', waitTime: 12, priority: 'Priority' },
    { id: 3, name: 'Robert Johnson', service: 'Cash Withdrawal', waitTime: 3, priority: 'Normal' },
    { id: 4, name: 'Emily Davis', service: 'Loan Inquiry', waitTime: 18, priority: 'VIP' },
    { id: 5, name: 'Michael Wilson', service: 'Card Services', waitTime: 7, priority: 'Normal' },
  ];

  const teamMembers = [
    { id: 1, name: 'Sarah Johnson', role: 'Teller', status: 'Available', customersServed: 18 },
    { id: 2, name: 'David Brown', role: 'Manager', status: 'Busy', customersServed: 12 },
    { id: 3, name: 'Lisa Anderson', role: 'Teller', status: 'Available', customersServed: 22 },
    { id: 4, name: 'Mark Thompson', role: 'Customer Service', status: 'Break', customersServed: 8 },
  ];

  const dailySchedule = [
    { time: '08:00 AM', event: 'Branch Opens', type: 'opening' },
    { time: '10:00 AM', event: 'Team Meeting', type: 'meeting' },
    { time: '12:00 PM', event: 'Lunch Break', type: 'break' },
    { time: '02:00 PM', event: 'Training Session', type: 'training' },
    { time: '04:00 PM', event: 'Performance Review', type: 'review' },
    { time: '05:00 PM', event: 'Branch Closes', type: 'closing' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Greeter Dashboard</h1>
              <p className="mt-1 text-lg text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-fuchsia-50 px-4 py-2 rounded-lg">
                <div className="text-sm text-fuchsia-600">Customers Waiting</div>
                <div className="text-lg font-semibold text-fuchsia-900">
                  {queueStats.waitingCustomers}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Waiting Customers</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{queueStats.waitingCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Wait Time (min)</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{queueStats.avgWaitTime}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Served Today</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{queueStats.servedToday}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Bell className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Peak Hours</dt>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-semibold text-gray-900">{queueStats.peakHours}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Queue Management */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Queue</h3>
                  <div className="flex space-x-2">
                    <button 
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        activeTab === 'queue' 
                          ? 'bg-fuchsia-100 text-fuchsia-800' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('queue')}
                    >
                      Queue
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        activeTab === 'customers' 
                          ? 'bg-fuchsia-100 text-fuchsia-800' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('customers')}
                    >
                      Customers
                    </button>
                    <button 
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        activeTab === 'schedule' 
                          ? 'bg-fuchsia-100 text-fuchsia-800' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('schedule')}
                    >
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-4 py-5 sm:px-6">
                {activeTab === 'queue' && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wait Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {waitingCustomers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.service}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.waitTime} min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${customer.priority === 'VIP' ? 'bg-purple-100 text-purple-800' : 
                                  customer.priority === 'Priority' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-green-100 text-green-800'}`}>
                                {customer.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-green-600 hover:text-green-900">
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'customers' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-500">{member.role}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${member.status === 'Available' ? 'bg-green-100 text-green-800' :
                              member.status === 'Busy' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {member.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <TrendingUp className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Served: {member.customersServed} customers today
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-200">
                      {dailySchedule.map((item, index) => (
                        <li key={index} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {item.type === 'opening' && <Bell className="h-5 w-5 text-green-500" />}
                              {item.type === 'meeting' && <Users className="h-5 w-5 text-blue-500" />}
                              {item.type === 'break' && <Clock className="h-5 w-5 text-yellow-500" />}
                              {item.type === 'training' && <Calendar className="h-5 w-5 text-purple-500" />}
                              {item.type === 'review' && <TrendingUp className="h-5 w-5 text-indigo-500" />}
                              {item.type === 'closing' && <Bell className="h-5 w-5 text-red-500" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.event}</p>
                              <p className="text-sm text-gray-500">{item.time}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions and Information */}
          <div>
            {/* Quick Actions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-4">
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <UserPlus className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">Add Customer</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">Branch Map</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">Contact Support</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">Send Notification</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Branch Information */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Branch Information</h3>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Branch Hours</h4>
                    <p className="mt-1 text-sm text-gray-500">Mon-Fri: 8:30 AM - 4:30 PM</p>
                    <p className="text-sm text-gray-500">Sat: 9:00 AM - 1:00 PM</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Contact</h4>
                    <p className="mt-1 text-sm text-gray-500">Phone: +251 11 123 4567</p>
                    <p className="text-sm text-gray-500">Email: info@branch.cbe.et</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Location</h4>
                    <p className="mt-1 text-sm text-gray-500">Addis Ababa, Ethiopia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreeterDashboard;