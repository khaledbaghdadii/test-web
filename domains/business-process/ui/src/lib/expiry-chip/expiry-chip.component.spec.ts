import { render, screen } from "@testing-library/angular";
import { ExpiryChipComponent } from "./expiry-chip.component";

describe("ExpiryChipComponent", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows a tag with formatted expiry date when expiry is more than 7 days away", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-01T00:00:00Z"));

    await render(ExpiryChipComponent, {
      inputs: { expiryDate: "2025-10-15T14:29:00.976Z" },
    });

    expect(screen.getByText(/^Expires on Oct 15, 2025/)).toBeTruthy();
  });

  it("shows days remaining when expiry is within 7 days", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-10-12T00:00:00Z"));

    await render(ExpiryChipComponent, {
      inputs: { expiryDate: "2025-10-15T14:29:00.976Z" },
    });

    expect(screen.getByText(/^Expires in 3 Days on Oct 15, 2025/)).toBeTruthy();
  });

  it("shows singular day label when expiry is exactly 1 day away", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-10-14T00:00:00Z"));

    await render(ExpiryChipComponent, {
      inputs: { expiryDate: "2025-10-15T14:29:00.976Z" },
    });

    expect(screen.getByText(/^Expires in 1 Day on Oct 15, 2025/)).toBeTruthy();
  });

  it("shows expires today when expiry date is today", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-10-15T00:00:00Z"));

    await render(ExpiryChipComponent, {
      inputs: { expiryDate: "2025-10-15T14:29:00.976Z" },
    });

    expect(screen.getByText(/^Expires Today on Oct 15, 2025/)).toBeTruthy();
  });

  it("does not display any tag when the expiry date has passed", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-11-01T00:00:00Z"));

    await render(ExpiryChipComponent, {
      inputs: { expiryDate: "2025-10-15T14:29:00.976Z" },
    });

    expect(screen.queryByText(/Expires/)).toBeNull();
  });
});
