import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  UserCheck,
  FileText
} from 'lucide-react';

const AuthorizerDashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data for dashboard
  const authorizationStats = {
    pendingApprovals: 8,
    approvedToday: 15,
    rejectedToday: 2,
    totalValue: 12500000
  };

  const pendingAuthorizations = [
    { id: 1, customer: 'John Doe', transactionType: 'Fund Transfer', amount: 2500000, riskLevel: 'Medium', timeSubmitted: '2 hours ago' },
    { id: 2, customer: 'ABC Corporation', transactionType: 'RTGS Transfer', amount: 5000000, riskLevel: 'High', timeSubmitted: '4 hours ago' },
    { id: 3, customer: 'Jane Smith', transactionType: 'Cash Withdrawal', amount: 750000, riskLevel: 'Low', timeSubmitted: '5 hours ago' },
    { id: 4, customer: 'XYZ Ltd', transactionType: 'Foreign Exchange', amount: 125000, riskLevel: 'Medium', timeSubmitted: '1 day ago' },
  ];

  const recentActivity = [
    { id: 1, action: 'Approved', transaction: 'Fund Transfer', amount: 1500000, time: '10 min ago', status: 'success' },
    { id: 2, action: 'Rejected', transaction: 'Cash Withdrawal', amount: 3000000, time: '1 hour ago', status: 'rejected' },
    { id: 3, action: 'Approved', transaction: 'RTGS Transfer', amount: 7500000, time: '2 hours ago', status: 'success' },
    { id: 4, action: 'Reviewed', transaction: 'Account Opening', amount: 0, time: '3 hours ago', status: 'reviewed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Authorizer Dashboard</h1>
              <p className="mt-1 text-lg text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-fuchsia-50 px-4 py-2 rounded-lg">
                <div className="text-sm text-fuchsia-600">Total Value Today</div>
                <div className="text-lg font-semibold text-fuchsia-900">
                  {authorizationStats.totalValue.toLocaleString()} ETB
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
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Approvals</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{authorizationStats.pendingApprovals}</div>
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
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved Today</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{authorizationStats.approvedToday}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected Today</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{authorizationStats.rejectedToday}</div>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {authorizationStats.pendingApprovals > 0 
                          ? Math.round((authorizationStats.approvedToday / (authorizationStats.approvedToday + authorizationStats.rejectedToday)) * 100) 
                          : 0}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Authorizations */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Authorizations</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {authorizationStats.pendingApprovals} items
                  </span>
                </div>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingAuthorizations.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.transactionType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.amount.toLocaleString()} ETB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${item.riskLevel === 'High' ? 'bg-red-100 text-red-800' : 
                                item.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {item.riskLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.timeSubmitted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-green-600 hover:text-green-900">
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <XCircle className="h-5 w-5" />
                              </button>
                              <button className="text-blue-600 hover:text-blue-900">
                                <FileText className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="flow-root">
                  <ul className="divide-y divide-gray-200">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {activity.status === 'success' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : activity.status === 'rejected' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <UserCheck className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.action} {activity.transaction}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {activity.amount > 0 ? `${activity.amount.toLocaleString()} ETB` : 'Review completed'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Authorization Tools</h3>
              </div>
              <div className="px-4 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-4">
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">Bulk Approve</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">Risk Assessment</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                  <button className="flex items-center justify-between p-4 bg-fuchsia-50 rounded-lg hover:bg-fuchsia-100 transition-colors">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-fuchsia-600 mr-3" />
                      <span className="font-medium text-gray-900">High-Value Monitor</span>
                    </div>
                    <span className="text-fuchsia-600">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorizerDashboard;