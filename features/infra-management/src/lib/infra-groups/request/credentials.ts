export interface UpdateCredentialsRequest {
  credentials: Credentials;
}

export interface Credentials {
  username: string;
  password: string;
  type: CredentialsType;
}

export enum CredentialsType {
  USERNAME_PASSWORD_CREDENTIALS = "username_password_credentials",
}
