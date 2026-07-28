import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import { of } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ProjectSetupSidebarComponent } from "./project-setup-sidebar.component";

const mockAuthorizationService = { isAuthorized: jest.fn() };
const mockFeatureFlagResolver = { isFeatureEnabled: jest.fn() };
const mockProjectIdResolver = { projectId: signal("P1") };

async function renderComponent() {
  return render(ProjectSetupSidebarComponent, {
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

describe("ProjectSetupSidebarComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorizationService.isAuthorized.mockReturnValue(of(true));
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(false);
    mockProjectIdResolver.projectId = signal("P1");
  });

  it("renders the Process Templates item for the current project", async () => {
    await renderComponent();

    expect(
      await screen.findByRole("link", { name: "Process Templates" })
    ).toBeTruthy();
  });

  it("renders the Pools item when the pools feature flag is enabled", async () => {
    mockFeatureFlagResolver.isFeatureEnabled.mockResolvedValue(true);

    await renderComponent();

    expect(await screen.findByText("Pools")).toBeTruthy();
  });

  it("does not render the Pools item when the pools feature flag is disabled", async () => {
    await renderComponent();

    await screen.findByRole("link", { name: "Process Templates" });

    expect(screen.queryByText("Pools")).toBeNull();
  });

  it("renders the Runtime Properties item under Environments regardless of the pools feature flag", async () => {
    await renderComponent();

    expect(await screen.findByText("Runtime Properties")).toBeTruthy();
  });
});
