import axios from 'axios';

export const validateAccountWithCBS = async (accountNumber: string) => {
  // Replace with actual endpoint for CBS validation
  const res = await axios.get(`/api/Accounts/validate/${accountNumber}`);
  return res.data;
};


// Send OTP using AuthController endpoint
export const sendFundTransferOTP = async (phone: string) => {
  const res = await axios.post('/api/auth/request-otp', { phoneNumber: phone });
  return res.data;
};

// Verify OTP using AuthController endpoint
export const verifyFundTransferOTP = async (phone: string, otp: string) => {
  const res = await axios.post('/api/auth/verify-otp', { phoneNumber: phone, otp });
  return res.data;
};

export const submitFundTransfer = async (data: any) => {
  // Submits the fund transfer request to backend
  const res = await axios.post('/api/FundTransfer/Submit', data);
  return res.data;
};
