import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { OpenConfigEditorButtonComponent } from "./open-config-editor-button.component";
import { EnvironmentStatus } from "@mxevolve/domains/environment/util";
import { FeatureFlagResolver } from "@mxflow/feature-flags";

const mockFeatureFlagResolver = {
  isFeatureEnabled: jest.fn(),
};

async function renderComponent(
  status: EnvironmentStatus = EnvironmentStatus.READY
) {
  return render(OpenConfigEditorButtonComponent, {
    inputs: {
      projectId: "proj-001",
      environmentId: "env-001",
      status,
    },
    componentProviders: [
      { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
    ],
  });
}

describe("OpenConfigEditorButtonComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);
  });

  it("renders the Open Config Editor button when the feature flag is enabled", async () => {
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);

    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("Open Config Editor")).toBeTruthy()
    );
    expect(mockFeatureFlagResolver.isFeatureEnabled).toHaveBeenCalledWith(
      "proj-001",
      "workspace-configuration-editor-ui"
    );
  });

  it("does not render the button when the feature flag is disabled", async () => {
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.featureEnabled()).toBe(false)
    );
    expect(screen.queryByText("Open Config Editor")).toBeNull();
  });

  it("does not render the button when the feature flag check rejects", async () => {
    mockFeatureFlagResolver.isFeatureEnabled.mockRejectedValue(
      new Error("flag error")
    );

    const { fixture } = await renderComponent();

    await waitFor(() =>
      expect(fixture.componentInstance.featureEnabled()).toBe(false)
    );
    expect(screen.queryByText("Open Config Editor")).toBeNull();
  });

  it("disables the button and shows a tooltip when the environment is not ready", async () => {
    const { fixture } = await renderComponent(EnvironmentStatus.PREPARING);

    await waitFor(() =>
      expect(screen.getByText("Open Config Editor")).toBeTruthy()
    );
    expect(fixture.componentInstance.disabled()).toBe(true);
    expect(fixture.componentInstance.tooltip()).toBe(
      "Environment is not in a ready state."
    );
  });

  it("enables the button without a tooltip when the environment is ready", async () => {
    const { fixture } = await renderComponent(EnvironmentStatus.READY);

    await waitFor(() =>
      expect(screen.getByText("Open Config Editor")).toBeTruthy()
    );
    expect(fixture.componentInstance.disabled()).toBe(false);
    expect(fixture.componentInstance.tooltip()).toBeUndefined();
  });

  it("opens the configuration editor in a new tab when clicked", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
    const user = userEvent.setup();

    await renderComponent(EnvironmentStatus.READY);

    await waitFor(() =>
      expect(screen.getByText("Open Config Editor")).toBeTruthy()
    );
    await user.click(screen.getByText("Open Config Editor"));

    expect(openSpy).toHaveBeenCalledWith(
      "/app/proj-001/environments/env-001/configuration-editor",
      "_blank"
    );
    openSpy.mockRestore();
  });
});
