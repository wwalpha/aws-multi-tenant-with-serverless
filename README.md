# aws-multi-tenant-with-serverless

## APIs

| Service        | Path            | Method | Comment                                                 |
| -------------- | --------------- | ------ | ------------------------------------------------------- |
| tenant-regist  | /reg            | POST   |
| tenant-regist  | /reg/health     | GET    | Health check                                            |
| tenant-manager | /tenant/health  | GET    | Health check                                            |
| tenant-manager | /tenants        | GET    | Get all tenants                                         |
| tenant-manager | /tenants/system | GET    | Get tenant system                                       |
| tenant-manager | /tenant         | POST   | Create a tenant                                         |
| tenant-manager | /tenant/:id     | GET    | Get tenant                                              |
| tenant-manager | /tenant         | PUT    | Update tenant                                           |
| tenant-manager | /tenant/:id     | DELETE | Remove a tenant                                         |
| user-manager   | /user/health    | GET    | Health check                                            |
| user-manager   | /user/tables    | DELETE | Remove all tenant tables                                |
| user-manager   | /user/tenants   | DELETE | Remove cognito                                          |
| user-manager   | /user/pool/:id  | GET    | Lookup user pool for any user                           |
| user-manager   | /user/system    | POST   | Provision a new system admin user                       |
| user-manager   | /user/reg       | POST   | Provision a new tenant admin user                       |
| user-manager   | /user/enable    | PUT    | Enable a user that is currently disabled                |
| user-manager   | /user/disable   | PUT    | Disable a user that is currently enable                 |
| user-manager   | /users          | GET    | Get a list of users using a tenant id to scope the list |
| user-manager   | /user           | POST   | Create a new user                                       |
| user-manager   | /user/:id       | GET    | Get user attributes                                     |
| user-manager   | /user           | PUT    | Update a user's attributes                              |
| user-manager   | /user/:id       | GET    | Delete a user                                           |
| auth-manager   | /auth/health    | GET    | Health check                                            |
| auth-manager   | /auth           | POST   | Process login request                                   |
| auth-manager   | /auth           | POST   | Process login request                                   |
| token-manager  | /token/pool/:id | GET    | Process login request                                   |
