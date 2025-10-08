


export interface PettyCashFormResponseDto {
  id: string;
  formReferenceId: string;

  // Maker Requests
  makerRequestInitial: boolean;
  makerRequestAdditional: boolean;
  makerRequestAdditionalSurrender: boolean;


  managerGiveAdditionalCashReq: boolean;
  makerGiveAdditionalSurrender : boolean;

  // Initial Cash Flow
  cashReceivedFromVault: number;
  initialApprovalByMaker?: boolean;
  cashSurrenderedToVault: number;
  initialApprovalByVManager?: boolean;

  // Additional Cash Flow
  additionalCashReceivedFromVault: number;
  additionalApprovalByMaker?: boolean;
  additionalCashSurrenderedToVault: number;
  additionalApprovalByVManager?: boolean;

  // Foreign Currency
  foreignCurrencyApprovalByManager: boolean;

  // Transactions
  cashReceivedFromCustomers: number;
  cashPaidToCustomers: number;
  totalCoins: number;

  // Denominations & Foreign Currencies
  denominations?: string;
  foreignCurrencies?: string;

  // Calculations
  subtotal: number;
  totalPettyCash: number;

  // Balances
  previousDayBalance: number;
  todayBalance: number;

  // Status
  status: string; // enum serialized as string from backend

  // Dates
  submittedAt: string;
  updatedAt: string;

  // Navigation / linked info
  branchId: string;
  branchName?: string;
  frontMakerId: string;
  frontMakerName?: string;
  voultManagerId?: string;
  voultManagerName?: string;
}
