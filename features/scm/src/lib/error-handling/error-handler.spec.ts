import { ErrorHandler } from "./error-handler";
import { HttpErrorResponse } from "@angular/common/http";
import { ExceptionResponse } from "./model/exception-response";

describe("ErrorHandler", () => {
  describe("extractMessage", () => {
    it("should extract message from HttpErrorResponse", () => {
      const exceptionResponse: ExceptionResponse = {
        status: 400,
        message: "Bad Request Error",
        timestamp: "2026-02-05T12:00:00Z",
        errors: {},
        failureReason: null,
      };

      const httpError = new HttpErrorResponse({
        error: exceptionResponse,
        status: 400,
        statusText: "Bad Request",
      });

      const result = ErrorHandler.extractMessage(httpError);

      expect(result).toBe("Bad Request Error");
    });
  });

  describe("extractStatus", () => {
    it("should extract status from HttpErrorResponse", () => {
      const exceptionResponse: ExceptionResponse = {
        status: 404,
        message: "Not Found",
        timestamp: "2026-02-05T12:00:00Z",
        errors: {},
        failureReason: null,
      };

      const httpError = new HttpErrorResponse({
        error: exceptionResponse,
        status: 404,
        statusText: "Not Found",
      });

      const result = ErrorHandler.extractStatus(httpError);

      expect(result).toBe(404);
    });
  });

  describe("createErrorWithStatus", () => {
    it("should create Error object with status property", () => {
      const exceptionResponse: ExceptionResponse = {
        status: 500,
        message: "Internal Server Error",
        timestamp: "2026-02-05T12:00:00Z",
        errors: {},
        failureReason: null,
      };

      const httpError = new HttpErrorResponse({
        error: exceptionResponse,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = ErrorHandler.createErrorWithStatus(httpError);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Internal Server Error");
      expect(result.status).toBe(500);
    });
  });
});
