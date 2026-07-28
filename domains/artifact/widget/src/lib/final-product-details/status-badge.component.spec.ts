import { render, screen } from "@testing-library/angular";
import { FinalProductStatusBadgeComponent } from "./status-badge.component";

async function renderComponent(state: string) {
  return render(FinalProductStatusBadgeComponent, {
    inputs: { state },
  });
}

describe("FinalProductStatusBadgeComponent", () => {
  it('shows "Available" label and check_circle icon for available state', async () => {
    await renderComponent("available");
    expect(screen.getByText("Available")).toBeTruthy();
    expect(screen.getByText("check_circle")).toBeTruthy();
  });

  it('shows "Failed" label and cancel icon for failed state', async () => {
    await renderComponent("failed");
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("cancel")).toBeTruthy();
  });

  it('shows "Creating" label and hourglass_empty icon for creating state', async () => {
    await renderComponent("creating");
    expect(screen.getByText("Creating")).toBeTruthy();
    expect(screen.getByText("hourglass_empty")).toBeTruthy();
  });

  it('shows "Purged" label and delete icon for purged state', async () => {
    await renderComponent("purged");
    expect(screen.getByText("Purged")).toBeTruthy();
    expect(screen.getByText("delete")).toBeTruthy();
  });

  it('shows "Purging" label and cleaning_services icon for purging state', async () => {
    await renderComponent("purging");
    expect(screen.getByText("Purging")).toBeTruthy();
    expect(screen.getByText("cleaning_services")).toBeTruthy();
  });

  it('shows "Purge Failed" label and error icon for purge_failed state', async () => {
    await renderComponent("purge_failed");
    expect(screen.getByText("Purge Failed")).toBeTruthy();
    expect(screen.getByText("error")).toBeTruthy();
  });

  it('shows "Unknown Status" label and help icon for an unrecognised state', async () => {
    await renderComponent("some_unknown_state");
    expect(screen.getByText("Unknown Status")).toBeTruthy();
    expect(screen.getByText("help")).toBeTruthy();
  });

  it('shows "Available" label when state is uppercase', async () => {
    await renderComponent("AVAILABLE");
    expect(screen.getByText("Available")).toBeTruthy();
    expect(screen.getByText("check_circle")).toBeTruthy();
  });
});
