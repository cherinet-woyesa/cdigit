export interface ServiceRequestParams {
  endpoint: string;
  requestId: string;
}

export interface ServiceConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  endpoint: string;
}

export interface ServiceDetailProps {
  endpoint: string;
  requestId?: string;
  onBack: () => void;
}
export interface ServiceRequest {
  id?: string;
  formReferenceId?: string;
  accountHolderName?: string;
  customerName?: string;
  name?: string;
  fullName?: string;
  customerFullName?: string;
  phoneNumber?: string;
  accountNumber?: string;
  accountNo?: string;
  account?: string;
  status?: string;
  requestStatus?: string;
  submittedAt?: string;
  createdAt?: string;
  requestDate?: string;
  amount?: number;
  transferAmount?: number;
  requestedAmount?: number;
  // Additional fields that might exist in different service requests
  [key: string]: any;
}