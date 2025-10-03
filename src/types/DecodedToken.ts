/** Token claims we need */
export interface DecodedToken {
    BranchId: string;
    nameid: string; // makerId
    role?: string;
    unique_name?: string;
    email?: string;
    exp?: number;
    iss?: string;
    aud?: string;
};
