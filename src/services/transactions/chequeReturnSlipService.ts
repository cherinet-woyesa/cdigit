
import { apiClient } from '@services/http';

export interface ChequeReturnSlipData {
  branchId: string;
  chequeNumber: string;
  amount: number;
  returnedReason: string;
  authorizedSignature: string;
  endorsementMissing: boolean;
  payeeEndorsementRequired: boolean;
  payeeEndorsementIrregular: boolean;
  drawerSignatureDiffers: boolean;
  alterationRequiresDrawerSignature: boolean;
  accountClosed: boolean;
  chequePostDated: boolean;
  chequeOutdated: boolean;
  amountWordsFiguresDiffer: boolean;
  paymentStoppedByDrawer: boolean;
  depositItemsNotCleared: boolean;
  chequeMutilated: boolean;
  drawerSignatureMissing: boolean;
  additionalSignatureRequired: boolean;
  accountTransferred: boolean;
  insufficientFund: boolean;
  signatures: { signatureData: string }[];
  phoneNumber: string;
  otpCode: string;
}

class ChequeReturnSlipService {
  async submitRequest(data: ChequeReturnSlipData) {
    return apiClient.post('/ChequeReturnSlip/submit', data);
  }
}

export const chequeReturnSlipService = new ChequeReturnSlipService();
export default chequeReturnSlipService;
