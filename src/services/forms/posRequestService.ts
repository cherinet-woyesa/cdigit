import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type PosRequestCreateDto = {
  BranchId: string;
  OtpCode: string;
  AccountNumber: string;
  CustomerName: string;
  PhoneNumber: string;
  ContactNumber: string;
  SecondaryContactNumber?: string | null;
  Address: {
    City: string;
    Subcity: string;
    Wereda: string;
    Kebele: string;
  };
  NatureOfBusiness: string;
  TypeOfBusiness: string;
  NumberOfPOSRequired: number;
  TermsAccepted: boolean;
};

export type PosRequestResponseDto = {
  Id: string;
  FormReferenceId: string;
  SubmittedAt: string;
  Status: string;
  BranchName: string;
  WindowNumber?: string | null;
  AccountNumber: string;
  CustomerName: string;
  BusinessName?: string | null;
  ContactNumber: string;
  SecondaryContactNumber?: string | null;
  Address: string;
  NatureOfBusiness: string;
  TypeOfBusiness: string;
  NumberOfPOSRequired: number;
  TermsAccepted: boolean;
};

export type ApiResponse<T> = { success: boolean; message?: string; data?: T };

export async function submitPosRequest(payload: PosRequestCreateDto): Promise<ApiResponse<PosRequestResponseDto>> {
  const res = await axios.post(`${API_BASE_URL}/PosRequest`, payload);
  return res.data;
}

// Create a service object for consistency with other services
const posRequestService = {
  submit: submitPosRequest
};

export default posRequestService;


