import type { StopPaymentOrder } from '../../../../../services/stopPaymentService';

export type FormMode = 'spo' | 'rspo';

export interface CustomerAccount {
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive' | 'dormant';
}

export interface SPOFormData {
  accountNumber: string;
  chequeNumber: string;
  amount: string;
  chequeDate: string;
  reason: string;
  termsAccepted: boolean;
}

export interface RSPOFormData {
  searchTerm: string;
  selectedSpoId: string;
  termsAccepted: boolean;
}

export interface StopPaymentFormProps {
  onSuccess: (data: StopPaymentOrder, isRevoke?: boolean) => void;
  onError: (error: Error) => void;
  customerId: string;
  branchName?: string;
  userName?: string;
}
