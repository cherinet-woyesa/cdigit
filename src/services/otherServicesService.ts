import axios from 'axios';

const API_BASE_URL = 'http://localhost:5268/api';

const authHeader = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export interface ServiceCount {
  serviceName: string;
  count: number;
}

export interface OtherServicesData {
  accountOpening: number;
  cbeBirrRegistration: number;
  eBankingApplication: number;
  posRequest: number;
  statementRequest: number;
  stopPayment: number;
  cbeBirrLink: number;
  rtgsTransfer: number;
  total: number;
}

const getServiceCount = async (
  endpoint: string,
  token: string,
  branchId?: string
): Promise<number> => {
  try {
    const url = branchId ? `${API_BASE_URL}/${endpoint}/${branchId}` : `${API_BASE_URL}/${endpoint}`;
    const response = await axios.get(url, authHeader(token));

    if (Array.isArray(response.data?.data)) {
      // If branchId is provided for filtering but not in the URL, filter client-side
      if (branchId && !url.includes(branchId)) {
        return response.data.data.filter((item: any) => item.branchId === branchId).length;
      }
      return response.data.data.length;
    }
    return 0;
  } catch (error) {
    console.error(`Failed to fetch count for ${endpoint}:`, error);
    return 0; // Return 0 on error to not break Promise.allSettled
  }
};

const otherServicesService = {
  getAccountOpeningCount: (branchId: string, token: string) =>
    getServiceCount('AccountOpening', token, branchId),

  getCbeBirrRegistrationCount: (branchId: string, token: string) =>
    getServiceCount('CbeBirrRegistrations', token, branchId),

  getEBankingApplicationCount: (branchId: string, token: string) =>
    getServiceCount('EBankingApplication', token, branchId),

  getPosRequestCount: (branchId: string, token: string) =>
    getServiceCount('PosRequest', token, branchId),

  getStatementRequestCount: (branchId: string, token: string) =>
    getServiceCount('StatementRequest', token, branchId),

  getStopPaymentCount: (branchId: string, token: string) =>
    getServiceCount(`StopPaymentOrder/branch`, token, branchId),

  getCbeBirrLinkCount: (branchId: string, token: string) =>
    getServiceCount('CbeBirrLink', token, branchId),

  getRtgsTransferCount: (branchId: string, token: string) =>
    getServiceCount('RtgsTransfer', token, branchId),

  getAllServicesCounts: async (branchId: string, token: string): Promise<OtherServicesData> => {
    const results = await Promise.allSettled([
      otherServicesService.getAccountOpeningCount(branchId, token),
      otherServicesService.getCbeBirrRegistrationCount(branchId, token),
      otherServicesService.getEBankingApplicationCount(branchId, token),
      otherServicesService.getPosRequestCount(branchId, token),
      otherServicesService.getStatementRequestCount(branchId, token),
      otherServicesService.getStopPaymentCount(branchId, token),
      otherServicesService.getCbeBirrLinkCount(branchId, token),
      otherServicesService.getRtgsTransferCount(branchId, token),
    ]);

    const counts = results.map((result) =>
      result.status === 'fulfilled' ? result.value : 0
    );

    const [
      accountOpening,
      cbeBirrRegistration,
      eBankingApplication,
      posRequest,
      statementRequest,
      stopPayment,
      cbeBirrLink,
      rtgsTransfer,
    ] = counts;

    const total =
      accountOpening +
      cbeBirrRegistration +
      eBankingApplication +
      posRequest +
      statementRequest +
      stopPayment +
      cbeBirrLink +
      rtgsTransfer;

    return {
      accountOpening,
      cbeBirrRegistration,
      eBankingApplication,
      posRequest,
      statementRequest,
      stopPayment,
      cbeBirrLink,
      rtgsTransfer,
      total,
    };
  },
};

export default otherServicesService;
