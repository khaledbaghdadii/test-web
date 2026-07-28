import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { AuthenticationService } from "@mxflow/core/auth";
import { MyRunsToggleComponent } from "./my-runs-toggle.component";

const USERNAME = "jane.doe";

const mockAuthService = {
  getUsername: jest.fn(() => USERNAME),
};

async function renderComponent(inputs: { enabled?: boolean } = {}) {
  return render(MyRunsToggleComponent, {
    inputs,
    providers: [{ provide: AuthenticationService, useValue: mockAuthService }],
  });
}

function toggle(): HTMLElement {
  return screen.getByRole("switch", { name: "My Builds" });
}

describe("MyBuildsToggleComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the My Builds label", async () => {
    await renderComponent();

    expect(screen.getByText("My Builds")).toBeTruthy();
  });

  it("is off by default", async () => {
    await renderComponent();

    expect(toggle()).not.toBeChecked();
  });

  it("emits the logged-in user as owner phrase when switched on", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent();
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.ownerPhrase.subscribe((value) =>
      emitted.push(value)
    );

    await user.click(toggle());

    expect(emitted).toEqual([USERNAME]);
  });

  it("emits undefined owner phrase when switched off again", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderComponent({ enabled: true });
    const emitted: (string | undefined)[] = [];
    fixture.componentInstance.ownerPhrase.subscribe((value) =>
      emitted.push(value)
    );

    await user.click(toggle());

    expect(emitted).toEqual([undefined]);
  });
});
