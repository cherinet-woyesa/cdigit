export interface PettyCashFormResponseDto {
    id: string;
    formReferenceId: string;
    cashReceivedFromVault: number;
    initialApprovalByMaker?: boolean;
    cashSurrenderedToVault: number;
    initialApprovalByVManager?: boolean;
    cashReceivedFromCustomers: number;
    cashPaidToCustomers: number;
    totalCoins: number;
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
}