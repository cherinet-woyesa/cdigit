import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.jpg';

const StaffLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.staffLogin(email, password);
      if (response.token) {
        // Use the AuthContext login method which properly decodes and handles the token
        login(response.token);
        
        // Decode token to get role for redirection
        const base64Url = response.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(window.atob(base64));
        
        // Enhanced role extraction
        const roles = decodedPayload.role || 
                     decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
                     decodedPayload.roles ||
                     decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];
        
        const userRole = Array.isArray(roles) ? roles[0] : roles;

        if (!userRole) {
          setError('Login successful, but your user role could not be determined. Please contact an administrator.');
          console.error('No role found in token payload:', decodedPayload);
          return;
        }
        
        console.log('User role detected for redirection:', userRole);
        console.log('Full token payload:', decodedPayload);
        
        // Role-based redirection - FIXED with proper case handling
        const normalizedRole = userRole.toLowerCase();
        switch (normalizedRole) {
          case 'maker':
            console.log('Redirecting to maker dashboard');
            navigate('/maker-dashboard', { replace: true });
            break;
          case 'admin':
            console.log('Redirecting to admin dashboard');
            navigate('/admin-dashboard', { replace: true });
            break;
          case 'manager':
            console.log('Redirecting to manager dashboard');
            navigate('/manager-dashboard', { replace: true });
            break;
          default:
            console.warn('Unknown role, redirecting to generic dashboard:', userRole);
            navigate('/dashboard', { replace: true });
        }
      } else {
        throw new Error('Token is missing in the response');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.Message || 
                          err.response?.data?.message || 
                          err.message || 
                          'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Staff login error:', err);
      console.error('Error response:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6e9] p-4">
      <div className="w-full max-w-sm md:max-w-md bg-white shadow-2xl rounded-2xl p-6 md:p-8 space-y-4">
        <div className="text-center space-y-2 md:space-y-4">
          <h1 className="text-base md:text-2xl font-semibold text-gray-900 uppercase">
            Commercial Bank of Ethiopia
          </h1>
          <div className="w-20 h-20 mx-auto md:w-44 md:h-44">
            <img 
              src={logo} 
              alt="CBE Logo" 
              className="h-full w-full object-contain rounded-full border-2 border-fuchsia-200" 
            />
          </div>
          <h2 className="text-xl md:text-4xl font-extrabold text-fuchsia-700">STAFF LOGIN</h2>
          <h2 className="text-xs md:text-xl font-semibold text-gray-800">
            Login with your AD account to access the dashboard
          </h2>
        </div>

        {error && <p className="text-red-600 text-center text-xs md:text-base">{error}</p>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium text-sm md:text-lg" htmlFor="email-input">Email</label>
            <input
              id="email-input"
              // type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your AD Email"
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500 text-sm md:text-lg p-2 md:p-3"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium text-sm md:text-lg" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your AD Password"
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500 text-sm md:text-lg p-2 md:p-3"
              disabled={loading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full bg-fuchsia-700 text-white py-2 md:py-3 rounded-lg hover:bg-fuchsia-800 disabled:opacity-50 transition text-sm md:text-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Logging in...
              </span>
            ) : 'Login'}
          </button>
        </form>
        
        {/* Back to Customer Flow Link */}
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 mb-2">Not a staff member?</p>
          <button
            onClick={() => navigate('/')}
            className="text-fuchsia-700 hover:text-fuchsia-800 font-medium text-xs md:text-sm underline transition-colors"
          >
            Back to Customer Services
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;