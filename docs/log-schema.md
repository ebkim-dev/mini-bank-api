
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
  * success: actorId, actorRole, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, executionStatus, durationMs, customerId, accountType, currency, accountStatus?, errorCode
* FetchAllByCustomerId
  * success: actorId, actorRole, customerId, executionStatus, durationMs, {accountId, customerId, accountType, currency, accountStatus}[]
  * failure: actorId, actorRole, executionStatus, durationMs, customerId, errorCode
* FetchByAccountId
  * success: actorId, actorRole, customerId, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, customerId, executionStatus, durationMs, accountId, errorCode
* Update
  * success: actorId, actorRole, customerId, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, customerId, executionStatus, durationMs, accountId, nickname?, accountStatus?, errorCode
* Delete
  * success: actorId, actorRole, customerId, executionStatus, durationMs, accountId, customerId, accountType, currency, accountStatus
  * failure: actorId, actorRole, customerId, executionStatus, durationMs, accountId, errorCode