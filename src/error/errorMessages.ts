export const ErrorMessages = {
  INVALID_CREDENTIALS: "Invalid credentials",

  USER_NOT_FOUND: "User not found",
  ACCOUNT_NOT_FOUND: "Account not found",
  TRANSACTION_NOT_FOUND: "Transaction not found",
  TRANSFER_NOT_FOUND: "Transfer not found",

  ACCOUNT_NOT_OWNED: "Account not owned by caller",
  TRANSACTION_NOT_OWNED: "Transaction not owned by caller",
  TRANSFER_NOT_OWNED: "Transfer not owned by caller",
  
  NO_SELF_TRANSFER_ALLOWED: "Self-transfers are not allowed",
  ACCOUNT_NOT_ACTIVE: "Account is not active",
  INSUFFICIENT_FUNDS: "Insufficient funds",
} as const;
