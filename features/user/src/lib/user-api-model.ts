export interface UserApiModel {
  id: string;
  displayName: string;
  mail: string;
}

export interface UsersApiModel {
  users: UserApiModel[];
  lastPage: boolean;
}
