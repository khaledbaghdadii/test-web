import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import { of } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ProjectSettingsSidebarComponent } from "./project-settings-sidebar.component";

const mockAuthorizationService = { isAuthorized: jest.fn() };
const mockFeatureFlagResolver = { isFeatureEnabled: jest.fn() };
const mockProjectIdResolver = { projectId: signal("P1") };

async function renderComponent() {
  return render(ProjectSettingsSidebarComponent, {
    providers: [
      provideRouter([]),
      { provide: AuthorizationService, useValue: mockAuthorizationService },
      { provide: FeatureFlagResolver, useValue: mockFeatureFlagResolver },
      {
        provide: ProjectIdRouteParamsResolverService,
        useValue: mockProjectIdResolver,
      },
    ],
  });
}

describe("ProjectSettingsSidebarComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorizationService.isAuthorized.mockReturnValue(of(true));
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
    mockProjectIdResolver.projectId = signal("P1");
  });

  it("renders the Details item for the current project", async () => {
    await renderComponent();

    expect(await screen.findByRole("link", { name: "Details" })).toBeTruthy();
  });

  it("renders the Config Audit item when the config-audit feature flag is enabled", async () => {
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);

    await renderComponent();

    expect(await screen.findByText("Config Audit")).toBeTruthy();
  });

  it("does not render the Config Audit item when the config-audit feature flag is disabled", async () => {
    await renderComponent();

    await screen.findByRole("link", { name: "Details" });

    expect(screen.queryByText("Config Audit")).toBeNull();
  });
});
