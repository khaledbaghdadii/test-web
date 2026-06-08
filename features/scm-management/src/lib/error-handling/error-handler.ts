import { HttpErrorResponse } from "@angular/common/http";
import { ExceptionResponse } from "./model/exception-response";

export class ErrorHandler {
  static extractMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Network error: ${error.error.message}`;
    }

    const exceptionResponse = error.error as ExceptionResponse;

    if (!exceptionResponse) {
      return error.message || "Unknown error";
    }

    if (
      exceptionResponse.errors &&
      Object.keys(exceptionResponse.errors).length > 0
    ) {
      return Object.entries(exceptionResponse.errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join("; ");
    }

    return exceptionResponse.message || "Request failed";
  }
}
