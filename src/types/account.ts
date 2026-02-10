
export enum AccountType {
    CHECKING = 'CHECKING',
    SAVINGS = 'SAVINGS',
}

export enum AccountStatus {
    ACTIVE = 'ACTIVE',
    CLOSED = 'CLOSED',
}

export type AccountCreateInput = {
    // POST /customers/:customerId/accounts 
    // Maybe getting customer id from the route (NOT body) is a better way to do this?
    customer_id: string;
    type: AccountType;
    currency: string;
    nickname?: string;
    status?: AccountStatus;
    balance?: string;
};

export type AccountUpdateInput = {
    // customer_id: string; <-- shouldn't be updated
    type?: AccountType;
    // currency?: string; <-- usually no updates
    nickname?: string;
    status?: AccountStatus;
    balance?: string;
};