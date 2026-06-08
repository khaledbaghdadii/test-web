import { Clipboard } from "@angular/cdk/clipboard";
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { PuttyConfigurationDialogComponent } from "./putty-configuration-dialog.component";

const mockClipboard = {
  copy: jest.fn(),
};

async function renderComponent() {
  return render(PuttyConfigurationDialogComponent, {
    inputs: {
      visible: true,
    },
    providers: [{ provide: Clipboard, useValue: mockClipboard }],
  });
}

describe("PuttyConfigurationDialogComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the SSH configuration instructions", async () => {
    await renderComponent();

    expect(
      screen.getByText("WinSCP - PuTTY client path configuration")
    ).toBeTruthy();
    expect(
      screen.getByText(/If the PuTTY client does not automatically/i)
    ).toBeTruthy();
    expect(screen.getByText("PuTTY/Terminal client path")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("copies the PuTTY command when Copy is clicked", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(mockClipboard.copy).toHaveBeenCalledWith(
      expect.stringContaining('"%ProgramFiles%\\PuTTY\\putty.exe"')
    );
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
  });
});
