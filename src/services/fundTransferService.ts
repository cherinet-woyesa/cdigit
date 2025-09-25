import axios from 'axios';
const API_BASE_URL = 'http://localhost:5268/api';

export const validateAccountWithCBS = async (accountNumber: string) => {
  const res = await axios.get(`${API_BASE_URL}/Accounts/AccountNumExist/${accountNumber}`);
  return res.data?.data ?? res.data;
};


// Send OTP using AuthController endpoint
export const sendFundTransferOTP = async (phone: string) => {
  const res = await axios.post(`${API_BASE_URL}/auth/request-otp`, { phoneNumber: phone });
  return res.data;
};

// Verify OTP using AuthController endpoint
export const verifyFundTransferOTP = async (phone: string, otp: string) => {
  const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, { PhoneNumber: phone, OtpCode: otp });
  return res.data;
};

export const submitFundTransfer = async (data: {
  phoneNumber: string;
  branchId: string;
  debitAccountNumber: string;
  amount: string;
  creditAccountNumber: string;
  remark?: string;
  otp: string;
}) => {
  const payload = {
    PhoneNumber: data.phoneNumber,
    BranchId: data.branchId,
    DebitAccountNumber: data.debitAccountNumber,
    BeneficiaryAccountNumber: data.creditAccountNumber,
    TransferAmount: Number(data.amount),
    Reason: data.remark ?? '',
    OtpCode: data.otp,
  };
  const res = await axios.post(`${API_BASE_URL}/FundTransfer/submit`, payload);
  return res.data?.data ?? res.data;
};

export const cancelFundTransferByCustomer = async (id: string): Promise<any> => {
  const res = await axios.put(`${API_BASE_URL}/FundTransfer/cancel-by-customer/${id}`);
  return res.data;
};

export const updateFundTransfer = async (
  id: string,
  data: {
    phoneNumber?: string;
    branchId: string;
    debitAccountNumber: string;
    creditAccountNumber: string;
    amount: string | number;
    remark?: string;
    otp: string;
  }
) => {
  const payload = {
    PhoneNumber: data.phoneNumber,
    BranchId: data.branchId,
    DebitAccountNumber: data.debitAccountNumber,
    BeneficiaryAccountNumber: data.creditAccountNumber,
    TransferAmount: Number(data.amount),
    Reason: data.remark ?? '',
    OtpCode: data.otp,
  };
  const res = await axios.put(`${API_BASE_URL}/FundTransfer/${id}`, payload);
  return res.data;
};
