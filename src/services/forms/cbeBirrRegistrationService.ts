// services/cbeBirrRegistrationService.ts
import { apiClient } from '@services/http';

export interface CbeBirrRegistrationData {
  formReferenceId?: string;
  customerPhoneNumber: string;
  fullName: string;
  branchId: string;
  placeOfBirth?: string;
  dateOfBirth: string | Date;
  gender: string;
  city?: string;
  wereda?: string;
  kebele?: string;
  email?: string;
  idNumber: string;
  issuedBy: string;
  maritalStatus: string;
  educationLevel: string;
  mothersFullName: string;
  digitalSignature?: string;
  otpCode?: string;
}

export interface CbeBirrRegistrationResponse {
  id: string;
  customerPhoneNumber: string;
  fullName: string;
  placeOfBirth?: string;
  dateOfBirth: string;
  gender: string;
  city?: string;
  wereda?: string;
  kebele?: string;
  email?: string;
  idNumber: string;
  issuedBy: string;
  maritalStatus: string;
  educationLevel: string;
  mothersFullName: string;
  digitalSignature?: string;
  status?: string;
  approvedById?: string;
  approvedByName?: string;
}

class CbeBirrRegistrationService {
  async createRegistration(data: CbeBirrRegistrationData) {
    const payload = {
      FormReferenceId: data.formReferenceId || `cbe-birr-${Date.now()}`,
      CustomerPhoneNumber: data.customerPhoneNumber,
      FullName: data.fullName,
      BranchId: data.branchId,
      PlaceOfBirth: data.placeOfBirth,
      DateOfBirth: typeof data.dateOfBirth === 'string' 
        ? data.dateOfBirth 
        : new Date(data.dateOfBirth).toISOString(),
      Gender: data.gender,
      City: data.city,
      Wereda: data.wereda,
      Kebele: data.kebele,
      Email: data.email,
      IdNumber: data.idNumber,
      IssuedBy: data.issuedBy,
      MaritalStatus: data.maritalStatus,
      EducationLevel: data.educationLevel,
      MothersFullName: data.mothersFullName,
      DigitalSignature: data.digitalSignature,
      ...(data.otpCode && { OtpCode: data.otpCode }),
    };

    return apiClient.post<CbeBirrRegistrationResponse>('/CbeBirrRegistrations', payload);
  }

  async getRegistration(id: string) {
    return apiClient.get<CbeBirrRegistrationResponse>(`/CbeBirrRegistrations/${id}`);
  }

  async updateRegistration(id: string, data: Partial<CbeBirrRegistrationData>) {
    const payload: any = { ...data };
    
    if (data.dateOfBirth) {
      payload.DateOfBirth = typeof data.dateOfBirth === 'string' 
        ? data.dateOfBirth 
        : new Date(data.dateOfBirth).toISOString();
    }
    
    if (data.fullName) payload.FullName = data.fullName;
    if (data.customerPhoneNumber) payload.CustomerPhoneNumber = data.customerPhoneNumber;
    if (data.branchId) payload.BranchId = data.branchId;
    if (data.placeOfBirth) payload.PlaceOfBirth = data.placeOfBirth;
    if (data.gender) payload.Gender = data.gender;
    if (data.city) payload.City = data.city;
    if (data.wereda) payload.Wereda = data.wereda;
    if (data.kebele) payload.Kebele = data.kebele;
    if (data.email) payload.Email = data.email;
    if (data.idNumber) payload.IdNumber = data.idNumber;
    if (data.issuedBy) payload.IssuedBy = data.issuedBy;
    if (data.maritalStatus) payload.MaritalStatus = data.maritalStatus;
    if (data.educationLevel) payload.EducationLevel = data.educationLevel;
    if (data.mothersFullName) payload.MothersFullName = data.mothersFullName;
    if (data.digitalSignature) payload.DigitalSignature = data.digitalSignature;
    if (data.otpCode) payload.OtpCode = data.otpCode;

    return apiClient.put<CbeBirrRegistrationResponse>(`/CbeBirrRegistrations/${id}`, payload);
  }

  async updateRegistrationStatus(id: string, status: string, userId?: string) {
    const payload = {
      Status: status,
      UserId: userId || null,
    };

    return apiClient.put(`/CbeBirrRegistrations/${id}/status`, payload);
  }

  async deleteRegistration(id: string) {
    return apiClient.delete(`/CbeBirrRegistrations/${id}`);
  }
}

export const cbeBirrRegistrationService = new CbeBirrRegistrationService();
export default cbeBirrRegistrationService;