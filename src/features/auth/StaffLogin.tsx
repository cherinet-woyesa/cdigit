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
        login(response.token);
        navigate('/dashboard');
      } else {
        throw new Error('Token is missing in the response');
      }
    } catch (err: any) {
      setError(err.response?.data?.Message || 'Login failed. Please check your credentials.');
      console.error('Staff login error:', err);
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
              type="email"
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
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Logging in...
              </span>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StaffLogin;