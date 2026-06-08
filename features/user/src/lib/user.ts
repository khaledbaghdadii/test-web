export interface User {
  id: string;
  displayName: string;
  mail: string;
}

export interface Users {
  users: User[];
  lastPage: boolean;
}
