import { MessageService } from "primeng/api";
import { NotificationService } from "./notification.service";

const message = "message";
const link = "link";
describe("Notification Service Test", () => {
  let messageService: MessageService;
  let service: NotificationService;

  beforeEach(() => {
    messageService = {
      add: jest.fn(),
      clear: jest.fn(),
    } as unknown as MessageService;

    service = new NotificationService(messageService);
  });

  it("should add a success message with link on show success", () => {
    service.showSuccess(message, link);

    expect(messageService.add).toHaveBeenCalledWith({
      key: "success-notification",
      severity: "success",
      summary: message,
      detail: link,
      life: 5000,
    });
  });

  it("should add a success message without link on show success if no link is provided", () => {
    service.showSuccess(message);

    expect(messageService.add).toHaveBeenCalledWith({
      key: "success-notification",
      severity: "success",
      summary: message,
      detail: undefined,
      life: 5000,
    });
  });

  it("should add an error message", () => {
    service.showError(message);

    expect(messageService.add).toHaveBeenCalledWith({
      key: "error-notification",
      severity: "error",
      summary: message,
      sticky: true,
    });
  });

  it("should clear error messages", () => {
    service.clearErrors();

    expect(messageService.clear).toHaveBeenCalledWith("error-notification");
  });
});
