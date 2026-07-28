import { provideRouter } from "@angular/router";
import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { EMPTY, of } from "rxjs";
import type {
  BreadcrumbNode,
  BreadcrumbResponse,
} from "@mxevolve/domains/analytics/data-access";
import { BreadcrumbApiService } from "@mxevolve/domains/analytics/data-access";
import { BreadcrumbComponent } from "./breadcrumb.component";

function node(
  partial: Partial<BreadcrumbNode> & Pick<BreadcrumbNode, "type">
): BreadcrumbNode {
  return { projectId: "p1", available: true, siblings: [], ...partial };
}

const DEFAULT_RESPONSE: BreadcrumbResponse = {
  target: node({
    type: "SCENARIO",
    id: "s1",
    name: "My Scenario",
    parent: node({
      type: "PROJECT",
      id: "p1",
      name: "Project Name",
    }),
  }),
};

const mockApi = {
  getBreadcrumb: jest.fn(),
};

const REQUIRED_INPUTS = {
  resourceType: "SCENARIO" as const,
  resourceId: "s1",
  projectId: "p1",
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(BreadcrumbComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    providers: [provideRouter([])],
    componentProviders: [{ provide: BreadcrumbApiService, useValue: mockApi }],
  });
}

describe("BreadcrumbComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.getBreadcrumb.mockReturnValue(of(DEFAULT_RESPONSE));
  });

  it("renders a Home link to the home page", async () => {
    await renderComponent();

    expect(
      (await screen.findByRole("link", { name: "Home" })).getAttribute("href")
    ).toBe("/home");
  });

  it("renders a link to the project", async () => {
    await renderComponent();

    expect(
      (await screen.findByRole("link", { name: "Project Name" })).getAttribute(
        "href"
      )
    ).toBe("/app/p1/home");
  });

  it("does not render a link for the current resource", async () => {
    await renderComponent();

    await screen.findByRole("link", { name: "Home" });

    expect(screen.queryByRole("link", { name: "My Scenario" })).toBeNull();
  });

  it("shows the current resource label", async () => {
    await renderComponent();

    expect(await screen.findByText("My Scenario")).toBeTruthy();
  });

  it("does not link an unavailable parent", async () => {
    mockApi.getBreadcrumb.mockReturnValue(
      of({
        target: node({
          type: "ENVIRONMENT_REQUEST",
          id: "r1",
          parent: node({ type: "ENVIRONMENT", available: false }),
        }),
      })
    );

    await renderComponent({ resourceType: "ENVIRONMENT_REQUEST" });

    await screen.findByRole("link", { name: "Home" });

    expect(screen.queryByRole("link", { name: "Environment" })).toBeNull();
  });

  it("renders a dropdown trigger for a bulk level", async () => {
    mockApi.getBreadcrumb.mockReturnValue(
      of({
        target: node({
          type: "SCENARIO",
          id: "s1",
          name: "My Scenario",
          parent: node({
            type: "BUSINESS_PROCESS",
            id: "binary-upgrade__a",
            name: "BP A",
            siblings: [
              node({
                type: "BUSINESS_PROCESS",
                id: "master-validation__b",
                name: "BP B",
              }),
            ],
          }),
        }),
      })
    );

    await renderComponent();

    const trigger = await screen.findByText(/BP A/);
    expect(trigger).toBeTruthy();
    // The dropdown trigger is a clickable <a> without href, not a navigation link.
    expect(screen.queryByRole("link", { name: /BP A/ })).toBeNull();
  });

  it("shows the bulk alternatives when the dropdown is opened", async () => {
    mockApi.getBreadcrumb.mockReturnValue(
      of({
        target: node({
          type: "SCENARIO",
          id: "s1",
          name: "My Scenario",
          parent: node({
            type: "BUSINESS_PROCESS",
            id: "binary-upgrade__a",
            name: "BP A",
            siblings: [
              node({
                type: "BUSINESS_PROCESS",
                id: "master-validation__b",
                name: "BP B",
              }),
            ],
          }),
        }),
      })
    );
    const user = userEvent.setup();

    await renderComponent();
    await user.click(await screen.findByText(/BP A/));

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "BP B" })).toBeTruthy();
    });
  });

  it("hides the entire breadcrumb when the API call fails", async () => {
    mockApi.getBreadcrumb.mockReturnValue(EMPTY);

    const { container } = await renderComponent();

    await waitFor(() => {
      expect(container.querySelector("p-breadcrumb")).toBeNull();
    });
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
  });
});
