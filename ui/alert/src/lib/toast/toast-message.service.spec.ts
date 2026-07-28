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
describe("Toast Message Service Test", () => {
  let messageService: MessageService;
  let service: ToastMessageService;

  beforeEach(() => {
    messageService = {
      add: jest.fn(),
      clear: jest.fn(),
    } as unknown as MessageService;

    TestBed.configureTestingModule({
      providers: [
        ToastMessageService,
        { provide: MessageService, useValue: messageService },
      ],
    });

    service = TestBed.inject(ToastMessageService);
  });

  describe("show success", () => {
    it("should show success message with detail correctly", () => {
      service.showSuccess(detail);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: "Success",
        detail: detail,
        life: 10000,
        icon: "pi pi-check",
      });
    });

    it("should override the summary if passed", () => {
      service.showSuccess(detail, summary);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "success",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-check",
      });
    });

    it("should add the data if passed", () => {
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

    it("should pass all the data correctly", () => {
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

  describe("show error", () => {
    it("should show error message with detail correctly", () => {
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

    it("should override the summary if passed", () => {
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

    it("should add the data if passed", () => {
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

    it("should pass all the data correctly", () => {
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

  describe("show warning", () => {
    it("should show warning message with detail correctly", () => {
      service.showWarning(detail);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: "Warning",
        detail: detail,
        life: 10000,
        icon: "pi pi-exclamation-triangle",
      });
    });

    it("should override the summary if passed", () => {
      service.showWarning(detail, summary);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-exclamation-triangle",
      });
    });

    it("should add the data if passed", () => {
      service.showWarning(detail, undefined, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: "Warning",
        detail: detail,
        life: 10000,
        data: toastData,
        icon: "pi pi-exclamation-triangle",
      });
    });

    it("should pass all the data correctly", () => {
      service.showWarning(detail, summary, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "warn",
        summary: summary,
        detail: detail,
        life: 10000,
        data: toastData,
        icon: "pi pi-exclamation-triangle",
      });
    });
  });

  describe("show info", () => {
    it("should show info message with detail correctly", () => {
      service.showInfo(detail);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "info",
        summary: "Info",
        detail: detail,
        life: 10000,
        icon: "pi pi-info-circle",
      });
    });

    it("should override the summary if passed", () => {
      service.showInfo(detail, summary);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "info",
        summary: summary,
        detail: detail,
        life: 10000,
        icon: "pi pi-info-circle",
      });
    });

    it("should add the data if passed", () => {
      service.showInfo(detail, undefined, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "info",
        summary: "Info",
        detail: detail,
        life: 10000,
        data: toastData,
        icon: "pi pi-info-circle",
      });
    });

    it("should pass all the data correctly", () => {
      service.showInfo(detail, summary, toastData);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: "info",
        summary: summary,
        detail: detail,
        life: 10000,
        data: toastData,
        icon: "pi pi-info-circle",
      });
    });
  });

  describe("clear errors", () => {
    it("should clear errors", () => {
      service.clearErrors();

      expect(messageService.clear).toHaveBeenCalled();
    });
  });
});
