// components/FormLayout.tsx
import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, MapPin, User, Home } from 'lucide-react';

// *** NEW: Import Context and Logos ***
import { useProductSelection } from '@context/ProductSelectionContext'; 
import ConventionalLogo from '@assets/ConventionalLogo.jpg'; 
import IFBLogo from '@assets/IFBLogo.png'; 


interface FormLayoutProps {
  title: string;
  children: ReactNode;
  phone?: string | null; // Make optional and allow null
  branchName?: string;
  loading?: boolean;
  error?: string | null; // Allow null
  className?: string;
}

export function FormLayout({ 
  title, 
  children, 
  phone, 
  branchName, 
  loading, 
  error, 
  className = "" 
}: FormLayoutProps) {
  const navigate = useNavigate();

  // Get the selected Customer segment from context ***
  const { selectedProduct } = useProductSelection();
  // Determine logos based on selection
  const isIFB = selectedProduct === 'IFB';
  const logoLeft = isIFB ? IFBLogo : ConventionalLogo;
  const logoRight = isIFB ? ConventionalLogo : null; // Only Conventional logo is displayed on the right for IFB


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="h-12 w-12 text-fuchsia-700 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-fuchsia-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full mx-auto">
        <div className={`bg-white shadow-lg rounded-lg overflow-hidden border border-fuchsia-200 ${className}`}>
          {/* Header */}
          <header className="bg-fuchsia-700 text-white">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3"> {/* Added flex container */}
                  {/* LEFT LOGO - Always Conventional unless IFB is selected */}
                  <img src={logoLeft} alt={isIFB ? 'IFB Logo' : 'Conventional Logo'} className="h-8 w-8 rounded-full object-contain" />
                  
                  <div>
                    <h1 className="text-lg font-bold">{title}</h1>
                    <div className="flex items-center gap-2 text-amber-100 text-xs mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{branchName || 'Branch'}</span>
                    </div>
                  </div>

                  {/* RIGHT LOGO - Only displayed if IFB is selected (as per request: IFB logo before, Conventional after) */}
                  {logoRight && (
                    <img src={logoRight} alt="Conventional Logo" className="h-8 w-8 rounded-full object-contain ml-2 hidden sm:block" />
                  )}
                  
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white text-fuchsia-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-gray-100 flex items-center gap-1"
                  >
                    <Home className="h-4 w-4" />
                    Home
                  </button>
                  <div className="bg-fuchsia-800/50 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {phone || 'No phone'}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}