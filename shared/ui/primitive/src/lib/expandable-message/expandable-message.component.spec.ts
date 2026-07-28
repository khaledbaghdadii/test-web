import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { ExpandableMessageComponent } from "./expandable-message.component";

async function renderMessage(
  message: string,
  triggerAriaLabel = "See full message"
) {
  return render(ExpandableMessageComponent, {
    inputs: { message, triggerAriaLabel },
    providers: [provideNoopAnimations()],
  });
}

describe("ExpandableMessageComponent", () => {
  it("renders a short message without a more-details action", async () => {
    await renderMessage("Deployment failed");

    expect(screen.getByText("Deployment failed")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "See full message" })
    ).toBeNull();
  });

  it("renders an 80-character message without truncating it", async () => {
    const message = "x".repeat(80);
    await renderMessage(message);

    expect(screen.getByText(message)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "See full message" })
    ).toBeNull();
  });

  it("truncates a long message and opens the complete message in a dialog", async () => {
    const message = "x".repeat(81);
    await renderMessage(message);

    expect(screen.getByText(`${"x".repeat(80)}...`)).toBeTruthy();

    await userEvent.click(
      screen.getByRole("button", { name: "See full message" })
    );

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent(message)
    );
  });

  it("uses the configured accessible label for the more-details action", async () => {
    await renderMessage("x".repeat(81), "See full failure reason");

    expect(
      screen.getByRole("button", { name: "See full failure reason" })
    ).toBeTruthy();
  });
});
