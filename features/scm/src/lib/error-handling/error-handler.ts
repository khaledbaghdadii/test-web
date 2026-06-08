import { HttpErrorResponse } from "@angular/common/http";
import { ExceptionResponse } from "./model/exception-response";
import { ScmFailureReason } from "./model/scm-failure-reason";
import { ScmOperationError } from "./model/scm-operation-error";

export class ErrorHandler {
  static extractMessage(error: HttpErrorResponse): string {
    const exceptionResponse = error.error as ExceptionResponse;
    return exceptionResponse.message;
  }

  static extractStatus(error: HttpErrorResponse): number {
    const exceptionResponse = error.error as ExceptionResponse;
    return exceptionResponse.status;
  }

  static createErrorWithStatus(
    error: HttpErrorResponse
  ): Error & { status: number } {
    const message = this.extractMessage(error);
    const status = this.extractStatus(error);
    const err = new Error(message) as Error & { status: number };
    err.status = status;
    return err;
  }

  static createScmOperationError(error: HttpErrorResponse): ScmOperationError {
    const exceptionResponse = error.error as ExceptionResponse;
    const failureReason =
      (exceptionResponse.failureReason as ScmFailureReason) ?? null;
    return new ScmOperationError(exceptionResponse.message, failureReason);
  }
}
