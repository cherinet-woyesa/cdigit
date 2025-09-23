import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type EBankingApplicationRequestDto = {
  PhoneNumber: string;
  BranchId: string; // Guid as string
  AccountNumber?: string | null;
  AccountHolderName?: string | null;
  OtpCode?: string | null; // optional (frontend does not use OTP)
  NationalIdNumber?: string | null;
  AltIdNumber?: string | null;
  AltIdIssuer?: string | null;
  ServicesSelected: string[]; // e.g., ['mobile_banking', 'internet_banking']
  NewPhoneNumber?: string | null;
  NewAccountNumber?: string | null;
  UploadedIdPath?: string | null;
  Region?: string | null;
  City?: string | null;
  SubCity?: string | null;
  Wereda?: string | null;
  HouseNumber?: string | null;
  IdIssueDate?: string | null; // ISO string
  IdExpiryDate?: string | null; // ISO string
};

export type EBankingApplicationResponseDto = {
  FormReferenceId: string;
  BranchId: string;
  AccountNumber: string;
  AccountHolderName?: string | null;
  ServicesRequested?: string | null;
  QueueNumber: number;
  TokenNumber: string;
  Status: string;
  Message: string;
};

export type EBankingApplicationReadDto = any; // If needed later

export type ApiResponse<T> = { success: boolean; message?: string; data?: T };

export async function applyEBankingApplication(payload: EBankingApplicationRequestDto): Promise<ApiResponse<EBankingApplicationResponseDto>> {
  const body = { ...payload } as any;
  if (body.IdIssueDate instanceof Date) body.IdIssueDate = (body.IdIssueDate as Date).toISOString();
  if (body.IdExpiryDate instanceof Date) body.IdExpiryDate = (body.IdExpiryDate as Date).toISOString();
  const res = await axios.post(`${API_BASE_URL}/EBankingApplication`, body);
  return res.data;
}

export async function getEBankingApplications(): Promise<ApiResponse<EBankingApplicationReadDto[]>> {
  const res = await axios.get(`${API_BASE_URL}/EBankingApplication/All`);
  return res.data;
}

export async function getEBankingApplicationById(id: string): Promise<ApiResponse<EBankingApplicationReadDto>> {
  const res = await axios.get(`${API_BASE_URL}/EBankingApplication/By-Id/${id}`);
  return res.data;
}

export async function getEBankingApplicationsByPhone(phone: string): Promise<ApiResponse<EBankingApplicationReadDto[]>> {
  const res = await axios.get(`${API_BASE_URL}/EBankingApplication/By-Phonenumber/${encodeURIComponent(phone)}`);
  return res.data;
}

export async function updateEBankingApplication(id: string, payload: any): Promise<ApiResponse<EBankingApplicationReadDto>> {
  // Backend expects id as query param and DTO in body
  const res = await axios.put(`${API_BASE_URL}/EBankingApplication`, payload, { params: { id } });
  return res.data;
}

export async function deleteEBankingApplication(id: string): Promise<ApiResponse<any>> {
  const res = await axios.delete(`${API_BASE_URL}/EBankingApplication/${id}`);
  return res.data;
}

export async function cancelEBankingApplicationByCustomer(id: string): Promise<ApiResponse<any>> {
  const res = await axios.put(`${API_BASE_URL}/EBankingApplication/Cancel-By-Customer/${id}`);
  return res.data;
}
