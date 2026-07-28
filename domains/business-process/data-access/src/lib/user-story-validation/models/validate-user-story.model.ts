export interface ValidateUserStoryRequest {
  userStoryId: string;
}

export interface ValidateUserStoryResponse {
  valid: boolean;
  errorMessage: string;
}
