export interface ExceptionResponse {
  status: number;
  message: string;
  timestamp: string;
  errors: Record<string, string>;
  failureReason: string | null;
}
