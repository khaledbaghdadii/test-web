export interface HttpErrorResponse {
  error: Error;
}

interface Error {
  status: number;
  message: string;
  timestamp: string;
  errors?: Map<string, string>;
}
