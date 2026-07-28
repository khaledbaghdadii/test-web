import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { render, screen } from "@testing-library/angular";
import { of } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ProjectAssetsSidebarComponent } from "./project-assets-sidebar.component";

const mockAuthorizationService = { isAuthorized: jest.fn() };
const mockProjectIdResolver = { projectId: signal("P1") };

async function renderComponent() {
  return render(ProjectAssetsSidebarComponent, {
    providers: [
      provideRouter([]),
      { provide: AuthorizationService, useValue: mockAuthorizationService },
      {
        provide: ProjectIdRouteParamsResolverService,
        useValue: mockProjectIdResolver,
      },
    ],
  });
}

describe("ProjectAssetsSidebarComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorizationService.isAuthorized.mockReturnValue(of(true));
    mockProjectIdResolver.projectId = signal("P1");
  });

  it("renders the Merge Request item for the current project", async () => {
    await renderComponent();

    expect(
      await screen.findByRole("link", { name: "Merge Request" })
    ).toBeTruthy();
  });
});
