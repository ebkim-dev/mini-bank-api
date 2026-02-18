Flow Diagram for `PUT /accounts/:accountId`

1. Client sends `PUT /accounts/:accountId` to express server
1. Express parses json request 
    a. If parsing fails --> throw 400 --> errorHandler
1. Express attaches trace ID to request
1. Router matches `PUT /accounts/:accountId`
1. Auth middleware validates token (if enabled)
    a. If invalid --> throw `401` --> errorHandler
1. Zod validates `req.params.accountId` and `req.body` based on schema
    a. If invalid --> throw `400` --> errorHandler
1. Controller is called and extracts `accountId` and validates body fields
1. Controller calls `service.updateAccountById(accountId, body)`
1. Service invokes prisma to send UPDATE query to MySQL
    a. Record does not exist --> Prisma throws --> Error bubbles up to errorHandler --> errorHandler throws `404`
1. Prisma returns updated account to service
1. Service returns updated account to controller
1. Controller sends status `200` and JSON response
1. Express sends response to client
