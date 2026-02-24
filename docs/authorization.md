
# Accounts Authorization Matrix

| Endpoint                 | ADMIN   | STANDARD |
| --------                 | ------- | -------- |
| POST /accounts           | ✅     | ❌       |
| GET /accounts            | ✅     | Only own |
| GET /accounts/:id        | ✅     | Only own |
| PUT /accounts/:id        | ✅     | Only own |
| POST /accounts/:id/close | ✅     | ❌       |