export interface UserApiResponse {
  readonly id: string;
  readonly displayName: string;
  readonly mail: string;
}

export interface UserPageResponse {
  readonly content: UserApiResponse[];
}
