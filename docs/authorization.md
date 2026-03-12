
# Accounts Authorization Matrix

| Endpoint                 | ADMIN   | STANDARD |
| --------                 | ------- | -------- |
| POST /accounts           | ✅ | ✅ |
| GET /accounts            | ✅ | ✅ |
| GET /accounts/:id        | ✅ (ALL Accounts) | Owned accounts only |
| PUT /accounts/:id        | ✅ (ALL Accounts) | Owned accounts only |
| POST /accounts/:id/close | ✅ (ALL Accounts) | Owned accounts only |