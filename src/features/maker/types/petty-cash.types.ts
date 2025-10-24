export interface PettyCashFormResponseDto {
  id: string;
  formReferenceId: string;
  frontMakerId: string;
  frontMakerName: string;
  branchId: string;
  branchName: string;
  status: string;
  
  // Requests
  makerRequestInitial: boolean;
  makerRequestAdditional: boolean;
  makerRequestAdditionalSurrender: boolean;
  
  // Cash flows
  cashReceivedFromVault: number;
  cashSurrenderedToVault: number;
  additionalCashReceivedFromVault: number;
  additionalCashSurrenderedToVault: number;
  cashReceivedFromCustomers: number;
  cashPaidToCustomers: number;
  
  // Approvals
  initialApprovalByMaker: boolean;
  initialApprovalByVManager: boolean;
  additionalApprovalByMaker: boolean;
  foreignCurrencyApprovalByManager: boolean;
  
  // Balances
  previousDayBalance: number;
  todayBalance: number;
  totalCoins: number;
  subtotal: number;
  totalPettyCash: number;
  
  // Additional fields
  denominations?: string;
  foreignCurrencies?: string;
  managerGiveAdditionalCashReq?: boolean;
  makerGiveAdditionalSurrender?: boolean;
  
  // Timestamps
  submittedAt: string;
  updatedAt: string;
}

export interface InitialRequestDto {
  FrontMakerId: string;
  BranchId: string;
}

export interface PettyCashAction {
  type: 'initial' | 'additional' | 'surrender-initial' | 'surrender-additional';
  label: string;
  handler: () => Promise<void>;
  enabled: boolean;
  variant: 'primary' | 'secondary' | 'danger' | 'warning';
}