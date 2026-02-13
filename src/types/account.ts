
export enum AccountType {
    CHECKING = 'CHECKING',
    SAVINGS = 'SAVINGS',
}

export enum AccountStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
}

export type AccountCreateInput = {
    customer_id: string;
    type: AccountType;
    currency: string;
    nickname?: string;
    status?: AccountStatus;
    balance?: string;
};

export type AccountUpdateInput = {
    nickname?: string;
    status?: AccountStatus;
};