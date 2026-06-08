import { render, screen } from "@testing-library/angular";
import { ExecutionAlertDisplayComponent } from "./execution-alert-display.component";

describe("ExecutionAlertDisplayComponent", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows an expiry banner when the process is still running past its expiry date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-11-01T00:00:00Z"));

    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        expiryDate: "2025-10-15T00:00:00Z",
        endDate: undefined,
        errorMessage: undefined,
        aborted: false,
      },
    });

    expect(screen.getByText(/reached its expiry date/)).toBeTruthy();
  });

  it("shows an expiry banner when the process ended after its expiry date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-11-01T00:00:00Z"));

    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        expiryDate: "2025-10-15T00:00:00Z",
        endDate: "2025-10-20T00:00:00Z",
        errorMessage: undefined,
        aborted: false,
      },
    });

    expect(screen.getByText(/reached its expiry date/)).toBeTruthy();
  });

  it("does not show an expiry banner when the process is within its expiry date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-01T00:00:00Z"));

    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        expiryDate: "2025-10-15T00:00:00Z",
        endDate: undefined,
        errorMessage: undefined,
        aborted: false,
      },
    });

    expect(screen.queryByText(/reached its expiry date/)).toBeNull();
  });

  it("does not show an expiry banner when the process ended before its expiry date", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-10-10T00:00:00Z"));

    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        expiryDate: "2025-10-15T00:00:00Z",
        endDate: "2025-10-10T00:00:00Z",
        errorMessage: undefined,
        aborted: false,
      },
    });

    expect(screen.queryByText(/reached its expiry date/)).toBeNull();
  });

  it("shows the error message with error severity when the process is not aborted", async () => {
    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        errorMessage: "Something went wrong",
        aborted: false,
        expiryDate: undefined,
        endDate: undefined,
      },
    });

    const message = screen.getByText("Something went wrong");
    expect(message.closest("p-message")?.getAttribute("severity")).toBe(
      "error"
    );
  });

  it("shows the error message with info severity when the process is aborted", async () => {
    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        errorMessage: "Process was aborted",
        aborted: true,
        expiryDate: undefined,
        endDate: undefined,
      },
    });

    const message = screen.getByText("Process was aborted");
    expect(message.closest("p-message")?.getAttribute("severity")).toBe("info");
  });

  it("does not show any message", async () => {
    await render(ExecutionAlertDisplayComponent, {
      inputs: {
        errorMessage: undefined,
        aborted: false,
        expiryDate: undefined,
        endDate: undefined,
      },
    });

    expect(screen.queryByText(/reached its expiry date/)).toBeNull();
  });
});
