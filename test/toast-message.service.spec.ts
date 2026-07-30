import { TestBed } from "@angular/core/testing";
import { MessageService } from "primeng/api";
import { ToastMessageService } from "./toast-message.service";
import { ToastMessageData } from "./toast-message-data";

const detail = "detail";
const summary = "summary";
const toastData: ToastMessageData = {
  link: {
    href: "link",
    linkText: "here",
  },
};

describe("ToastMessageService", () => {
  let messageService: MessageService;
  let service: ToastMessageService;

  beforeEach(() => {
    messageService = {
      add: jest.fn(),
      clear: jest.fn(),
    } as unknown as MessageService;

    TestBed.configureTestingModule({
      providers: [{ provide: MessageService, useValue: messageService }],
    });

    service = TestBed.inject(ToastMessageService);
  });

  describe("showSuccess", () => {
    it("shows success message with detail", () => {
      service.showSuccess(detail);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: detail,
        life: 10000,
        icon: "pi pi-check",
      });
    });

    it("overrides the summary when provided", () => {
      service.showSuccess(detail, summary);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-check",
      });
    });

    it("includes the data when provided", () => {
      service.showSuccess(detail, undefined, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: detail,
        life: 10000,
        icon: "pi pi-check",
        data: toastData,
      });
    });

    it("passes all parameters correctly", () => {
      service.showSuccess(detail, summary, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-check",
        data: toastData,
      });
    });
  });

  describe("showError", () => {
    it("shows error message with detail", () => {
      service.showError(detail);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: detail,
        sticky: true,
        icon: "pi pi-times-circle",
        life: 10000,
      });
    });

    it("overrides the summary when provided", () => {
      service.showError(detail, summary);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: summary,
        detail: detail,
        sticky: true,
        icon: "pi pi-times-circle",
        life: 10000,
      });
    });

    it("includes the data when provided", () => {
      service.showError(detail, undefined, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: detail,
        sticky: true,
        data: toastData,
        icon: "pi pi-times-circle",
        life: 10000,
      });
    });

    it("passes all parameters correctly", () => {
      service.showError(detail, summary, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "error",
        summary: summary,
        detail: detail,
        sticky: true,
        data: toastData,
        icon: "pi pi-times-circle",
        life: 10000,
      });
    });
  });

  describe("showWarning", () => {
    it("shows warning message with detail", () => {
      service.showWarning(detail);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: "Warning",
        detail: detail,
        life: 10000,
        icon: "pi pi-exclamation-triangle",
      });
    });

    it("overrides the summary when provided", () => {
      service.showWarning(detail, summary);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-exclamation-triangle",
      });
    });

    it("includes the data when provided", () => {
      service.showWarning(detail, undefined, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: "Warning",
        detail: detail,
        life: 10000,
        icon: "pi pi-exclamation-triangle",
        data: toastData,
      });
    });

    it("passes all parameters correctly", () => {
      service.showWarning(detail, summary, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-exclamation-triangle",
        data: toastData,
      });
    });

    /**
     * A warning is advisory, so unlike an error it must time out on its own
     * rather than stay pinned until the user dismisses it.
     */
    it("does not stick, so it clears itself", () => {
      service.showWarning(detail);

      expect(messageService.add).toHaveBeenCalledWith(
        expect.not.objectContaining({ sticky: true })
      );
    });
  });

  describe("clearErrors", () => {
    it("clears all messages", () => {
      service.clearErrors();

      expect(messageService.clear).toHaveBeenCalled();
    });
  });
});
