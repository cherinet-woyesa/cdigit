import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type RtgsTransferRequestDto = {
  BranchId: string; // Guid string
  OrderingAccountNumber: string;
  BeneficiaryBank: string;
  BeneficiaryBranch: string;
  BeneficiaryAccountNumber: string;
  BeneficiaryName: string;
  TransferAmount: number;
  PaymentNarrative: string;
  CustomerTelephone?: string | null;
  DigitalSignature: string;
  OtpCode: string;
};

export type RtgsTransferResponseDto = {
  Id: string;
  FormReferenceId: string;
  BranchName: string;
  SubmittedAt: string;
  OrderingAccountNumber: string;
  OrderingCustomerName?: string;
  BeneficiaryBank: string;
  BeneficiaryBranch: string;
  BeneficiaryAccountNumber: string;
  BeneficiaryName: string;
  TransferAmount: number;
  PaymentNarrative: string;
  CustomerTelephone?: string | null;
  Status: string;
};

export type ApiResponse<T> = { success: boolean; message?: string; data?: T };

export async function submitRtgsTransfer(payload: RtgsTransferRequestDto): Promise<ApiResponse<RtgsTransferResponseDto>> {
  const res = await axios.post(`${API_BASE_URL}/RtgsTransfer/submit`, payload);
  return res.data;
}

export async function getRtgsTransferById(id: string): Promise<ApiResponse<RtgsTransferResponseDto>> {
  const res = await axios.get(`${API_BASE_URL}/RtgsTransfer/${id}`);
  return res.data;
}

export async function listRtgsTransfers(): Promise<ApiResponse<RtgsTransferResponseDto[]>> {
  const res = await axios.get(`${API_BASE_URL}/RtgsTransfer`);
  return res.data;
}

export async function updateRtgsStatus(id: string, status: string): Promise<ApiResponse<RtgsTransferResponseDto>> {
  const res = await axios.put(`${API_BASE_URL}/RtgsTransfer/${id}/status`, null, { params: { status } });
  return res.data;
}
