
# Log Schema

User/Auth
* Register 
  * success: executionStatus, durationMs, userId, username, userRole
  * failure: executionStatus, durationMs, username, errorCode
* Login 
  * success: executionStatus, durationMs, userId, username, userRole
  * failure: executionStatus, durationMs, username, errorCode

Accounts 
* Create 
  * success: actorId, actorRole, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, executionStatus, durationMs, customerId, accountType, currency, accountStatus?, errorCode
* FetchAllByCustomerId
  * success: actorId, actorRole, executionStatus, durationMs, {accountId, customerId, accountType, currency, accountStatus}[]
  * failure: actorId, actorRole, executionStatus, durationMs, customerId, errorCode
* FetchByAccountId
  * success: actorId, actorRole, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, executionStatus, durationMs, accountId, errorCode
* Update
  * success: actorId, actorRole, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, executionStatus, durationMs, accountId, nickname?, accountStatus?, errorCode
* Delete
  * success: actorId, actorRole, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, executionStatus, durationMs, accountId, errorCode