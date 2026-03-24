
# Log Schema

User/Auth
* Register 
  * success: executionStatus, durationMs, actorId, actorRole, customerId, username
  * failure: executionStatus, durationMs, username, errorCode
* Login 
  * success: executionStatus, durationMs, actorId, actorRole, customerId, username
  * failure: executionStatus, durationMs, username, errorCode
* Logout
  * success: executionStatus, durationMs, actorId, actorRole, customerId
  * failure: N/A
* Me
  * success: executionStatus, durationMs, actorId, actorRole, customerId
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, errorCode

Accounts 
* Create 
  * success: executionStatus, durationMs, actorId, actorRole, accountId, customerId, accountType, currency, accountStatus
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, accountType, currency, accountStatus?, errorCode
* FetchAllByCustomerId
  * success: executionStatus, durationMs, actorId, actorRole, customerId, {accountId, customerId, accountType, currency, accountStatus}[]
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, errorCode
* Fetch
  * success: executionStatus, durationMs, actorId, actorRole, customerId, accountId, customerId, accountType, currency, accountStatus
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, accountId, errorCode
* Update
  * success: executionStatus, durationMs, actorId, actorRole, customerId, accountId, customerId, accountType, currency, accountStatus
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, accountId, nickname?, accountStatus?, errorCode
* Delete
  * success: executionStatus, durationMs, actorId, actorRole, customerId, accountId, customerId, accountType, currency, accountStatus
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, accountId, errorCode

Transactions
* Create 
  * success: executionStatus, durationMs, actorId, actorRole, customerId, transactionId, accountId, transactionType, amount
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, accountId, errorCode
* FetchAllByAccountId
  * success: executionStatus, durationMs, actorId, actorRole, customerId, accountId, count
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, accountId, errorCode
* Fetch
  * success: executionStatus, durationMs, actorId, actorRole, customerId, transactionId, accountId, transactionType, amount
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, transactionId, errorCode

Transfers
* Create 
  * success: executionStatus, durationMs, actorId, actorRole, customerId, transferId, fromAccountId, toAccountId, amount
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, fromAccountId, toAccountId, amount, errorCode
* FetchAllByAccountId
  * success: executionStatus, durationMs, actorId, actorRole, customerId, {transferId, fromAccountId, toAccountId, amount}[]
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, fromAccountId, errorCode
* Fetch
  * success: executionStatus, durationMs, actorId, actorRole, customerId, transferId, fromAccountId, toAccountId, amount
  * failure: executionStatus, durationMs, actorId, actorRole, customerId, fromAccountId, errorCode
