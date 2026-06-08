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

    it("should extract field-specific errors when present", () => {
      const exceptionResponse: ExceptionResponse = {
        status: 400,
        message: "Validation failed",
        timestamp: "2026-02-05T12:00:00Z",
        errors: {
          branchPattern: "Branch pattern is invalid",
        },
        failureReason: null,
      };

      const httpError = new HttpErrorResponse({
        error: exceptionResponse,
        status: 400,
        statusText: "Bad Request",
      });

      const result = ErrorHandler.extractMessage(httpError);

      expect(result).toContain("branchPattern: Branch pattern is invalid");
    });

    it("should handle network errors", () => {
      const httpError = new HttpErrorResponse({
        error: new ErrorEvent("Network error", {
          message: "Connection failed",
        }),
        status: 0,
      });

      const result = ErrorHandler.extractMessage(httpError);

      expect(result).toContain("Network error");
      expect(result).toContain("Connection failed");
    });
  });
});
