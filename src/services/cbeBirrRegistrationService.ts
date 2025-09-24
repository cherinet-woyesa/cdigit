import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

export type CbeBirrRegistrationCreateDto = {
  CustomerPhoneNumber: string;
  FullName: string;
  BranchId: string;
  PlaceOfBirth?: string;
  DateOfBirth: string | Date;
  Gender: string;
  City?: string | null;
  Wereda?: string | null;
  Kebele?: string | null;
  Email?: string | null;
  IdNumber: string;
  IssuedBy: string;
  MaritalStatus: string;
  EducationLevel: string;
  MothersFullName: string;
  DigitalSignature?: string | null;
  OtpCode: string;
};

export type CbeBirrRegistrationReadDto = {
  Id: string;
  CustomerPhoneNumber: string;
  FullName: string;
  PlaceOfBirth?: string;
  DateOfBirth: string;
  Gender: string;
  City?: string | null;
  Wereda?: string | null;
  Kebele?: string | null;
  Email?: string | null;
  IdNumber: string;
  IssuedBy: string;
  MaritalStatus: string;
  EducationLevel: string;
  MothersFullName: string;
  DigitalSignature?: string | null;
  Status?: string;
  ApprovedById?: string | null;
  ApprovedByName?: string | null;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export async function createCbeBirrRegistration(payload: CbeBirrRegistrationCreateDto): Promise<ApiResponse<CbeBirrRegistrationReadDto>> {
  // Normalize date to ISO
  const body = {
    ...payload,
    DateOfBirth: typeof payload.DateOfBirth === 'string' ? payload.DateOfBirth : new Date(payload.DateOfBirth).toISOString(),
  } as any;

  const res = await axios.post(`${API_BASE_URL}/CbeBirrRegistrations`, body);
  return res.data;
}

export async function getCbeBirrRegistration(id: string): Promise<ApiResponse<CbeBirrRegistrationReadDto>> {
  const res = await axios.get(`${API_BASE_URL}/CbeBirrRegistrations/${id}`);
  return res.data;
}

export async function updateCbeBirrRegistration(
  id: string,
  payload: Partial<CbeBirrRegistrationCreateDto>
): Promise<ApiResponse<object>> {
  // Accepts same shape as create; backend uses UpdateDto
  const body = {
    ...payload,
    ...(payload.DateOfBirth
      ? { DateOfBirth: typeof payload.DateOfBirth === 'string' ? payload.DateOfBirth : new Date(payload.DateOfBirth).toISOString() }
      : {}),
  } as any;
  const res = await axios.put(`${API_BASE_URL}/CbeBirrRegistrations/${id}`, body);
  return res.data;
}

export async function updateCbeBirrRegistrationStatus(
  id: string,
  status: string,
  userId?: string
): Promise<ApiResponse<object>> {
  const res = await axios.put(`${API_BASE_URL}/CbeBirrRegistrations/${id}/status`, {
    Status: status,
    UserId: userId ?? null,
  });
  return res.data;
}

export async function deleteCbeBirrRegistration(id: string): Promise<ApiResponse<object>> {
  const res = await axios.delete(`${API_BASE_URL}/CbeBirrRegistrations/${id}`);
  return res.data;
}
