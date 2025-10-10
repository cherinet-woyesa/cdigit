import React from "react";
import { 
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

interface OtherServicesProps {
  onServiceClick: (serviceType: string) => void;
}

const OtherServices: React.FC<OtherServicesProps> = ({ onServiceClick }) => {
  const services = [
    { 
      title: "Account Opening", 
      description: "Process new account applications", 
      color: "fuchsia", 
      icon: DocumentTextIcon, 
      count: 3,
      type: "account-opening"
    },
    { 
      title: "CBE Birr Requests", 
      description: "Handle CBE Birr registration and support", 
      color: "purple", 
      icon: DevicePhoneMobileIcon, 
      count: 5,
      type: "cbe-birr"
    },
    { 
      title: "E-Banking Request", 
      description: "Manage e-banking service requests", 
      color: "indigo", 
      icon: ComputerDesktopIcon, 
      count: 2,
      type: "e-banking"
    },
  ];

  const quickActions = [
    {
      title: "Print Today's Report",
      description: "Generate and print transaction summary",
      icon: DocumentTextIcon,
      type: "print-report"
    },
    {
      title: "View Performance",
      description: "Check your efficiency metrics and stats",
      icon: ChartBarIcon,
      type: "performance"
    },
    {
      title: "Need Assistance",
      description: "Contact supervisor for support",
      icon: HandRaisedIcon,
      type: "assistance"
    },
    {
      title: "System Settings",
      description: "Preferences and configuration",
      icon: CogIcon,
      type: "settings"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Services Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Other Services</h2>
            <p className="text-gray-600 text-sm mt-1">Manage additional customer service requests</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total Requests Waiting</div>
            <div className="text-lg font-bold text-fuchsia-700">10</div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            
            return (
              <div
                key={index}
                onClick={() => onServiceClick(service.type)}
                className={`relative rounded-lg shadow-sm p-4 bg-white cursor-pointer border-t-4 border-${service.color}-500 transform transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group`}
              >
                {/* Badge Count */}
                {service.count > 0 && (
                  <div className={`absolute -top-2 -right-2 bg-${service.color}-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-6 text-center`}>
                    {service.count}
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${service.color}-50 group-hover:bg-${service.color}-100 transition-colors`}>
                    <IconComponent className={`h-5 w-5 text-${service.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-md font-bold text-gray-800 group-hover:text-gray-900">
                      {service.title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-snug mt-1">
                      {service.description}
                    </p>
                  </div>
                  <ArrowPathIcon className={`h-4 w-4 text-gray-300 group-hover:text-${service.color}-600 group-hover:rotate-180 transition-all`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-fuchsia-700 mb-4 text-lg">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            
            return (
              <button 
                key={index}
                onClick={() => onServiceClick(action.type)}
                className="text-left p-4 rounded-lg border border-gray-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-fuchsia-100 group-hover:bg-fuchsia-200 transition-colors">
                    <IconComponent className="h-4 w-4 text-fuchsia-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-fuchsia-700 group-hover:text-fuchsia-800 text-sm">
                      {action.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {action.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-fuchsia-100 text-sm">Completed Today</p>
              <p className="text-2xl font-bold mt-1">24</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Pending Review</p>
              <p className="text-2xl font-bold mt-1">8</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <ClockIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Success Rate</p>
              <p className="text-2xl font-bold mt-1">94%</p>
            </div>
            <div className="p-2 bg-white/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Import the missing icons
const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const HandRaisedIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default OtherServices;