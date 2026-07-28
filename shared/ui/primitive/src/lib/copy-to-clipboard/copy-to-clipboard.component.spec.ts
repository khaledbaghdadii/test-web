import { fireEvent, render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { MxevolveIconComponent } from "../icons/mxevolve-icon/mxevolve-icon.component";
import { CopyToClipboardComponent } from "./copy-to-clipboard.component";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent)];

async function renderComponent(value: string) {
  return render(CopyToClipboardComponent, {
    inputs: { value },
    componentImports: MOCK_IMPORTS,
  });
}

describe("CopyToClipboardComponent", () => {
  let writeText: jest.Mock;

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  it("renders a copy button", async () => {
    await renderComponent("abc-123");

    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders the copy icon", async () => {
    const { fixture } = await renderComponent("abc-123");

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe("content_copy");
  });

  it("copies the value to the clipboard on click", async () => {
    await renderComponent("abc-123");

    fireEvent.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("abc-123");
  });

  it("shows the check icon immediately after clicking copy", async () => {
    jest.useFakeTimers();
    const { fixture } = await renderComponent("abc-123");

    fireEvent.click(screen.getByRole("button"));
    fixture.detectChanges();

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe("check");

    jest.useRealTimers();
  });

  it("resets the icon back to copy after 1.5s", async () => {
    jest.useFakeTimers();
    const { fixture } = await renderComponent("abc-123");

    fireEvent.click(screen.getByRole("button"));
    fixture.detectChanges();

    jest.advanceTimersByTime(1500);
    fixture.detectChanges();

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe("content_copy");

    jest.useRealTimers();
  });

  it("clears the previous timer when copy is clicked multiple times", async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const { fixture } = await renderComponent("abc-123");

    fireEvent.click(screen.getByRole("button"));
    fixture.detectChanges();
    fireEvent.click(screen.getByRole("button"));
    fixture.detectChanges();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("does not reset the icon before 1.5s has elapsed", async () => {
    jest.useFakeTimers();
    const { fixture } = await renderComponent("abc-123");

    fireEvent.click(screen.getByRole("button"));
    fixture.detectChanges();

    jest.advanceTimersByTime(1499);
    fixture.detectChanges();

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe("check");

    jest.useRealTimers();
  });
});
