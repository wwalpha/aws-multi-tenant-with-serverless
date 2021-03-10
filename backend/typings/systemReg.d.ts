export interface RegistSystemTenantRequest {
  /** email address */
  email: string;
  /** company name */
  companyName: string;
  /** first name */
  firstName: string;
  /** last name */
  lastName: string;
}

export interface RegistSystemTenantResponse {
  status: string;
}

export interface DeleteSystemAdminRequest {
  id: string;
}

export interface DeleteSystemAdminResponse {}
