export interface PettyCashFormResponseDto {
    id: string;
    formReferenceId: string;
    makerRequestInitial?: boolean;
    cashReceivedFromVault: number;
    initialApprovalByMaker?: boolean;
    cashSurrenderedToVault: number;
    initialApprovalByVManager?: boolean;
    makerRequestAdditional?: boolean;
    additionalCashReceivedFromVault?: number;
    additionalApprovalByMaker?: boolean;
    additionalCashSurrenderedToVault?: number;
    additionalApprovalByVManager?: boolean;
    foreignCurrencyApprovalByManager?: boolean;
    cashReceivedFromCustomers: number;
    cashPaidToCustomers: number;
    totalCoins: number;
    denominations?: string;
    foreignCurrencies?: string;
    subtotal: number;
    totalPettyCash: number;
    previousDayBalance: number;
    todayBalance: number;
    submittedAt: string; // Use string for date serialization
    updatedAt: string; // Use string for date serialization
    branchId: string;
    branchName?: string;
    frontMakerId?: string;
    frontMakerName?: string;
    voultManagerId?: string;
    voultManagerName?: string;
    makerRequestAdditionalSurrender?: boolean;
    makerGiveAdditionalSurrender?: boolean;
    managerGiveAdditionalCashReq?: boolean;
}