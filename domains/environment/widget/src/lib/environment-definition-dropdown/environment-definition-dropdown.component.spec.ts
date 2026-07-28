import { render, screen } from "@testing-library/angular";
import { of } from "rxjs";
import { EnvironmentDefinitionDropdownComponent } from "./environment-definition-dropdown.component";
import type { EnvironmentDefinition } from "@mxevolve/domains/environment/data-access";
import {
  EnvironmentDefinitionService,
  EnvironmentDefinitionStatus,
} from "@mxevolve/domains/environment/data-access";

const MOCK_DEFINITIONS: EnvironmentDefinition[] = [
  {
    id: "env-001",
    name: "Production",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
  {
    id: "env-002",
    name: "Staging",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
];

const mockEnvironmentService = {
  getEnvironmentDefinitions: jest.fn(),
};

async function renderComponent(
  inputs: Partial<{ projectId: string; placeholder: string }> = {}
) {
  return render(EnvironmentDefinitionDropdownComponent, {
    inputs: { projectId: "project-123", ...inputs },
    componentProviders: [
      {
        provide: EnvironmentDefinitionService,
        useValue: mockEnvironmentService,
      },
    ],
  });
}

describe("EnvironmentDefinitionDropdownComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnvironmentService.getEnvironmentDefinitions.mockReturnValue(
      of(MOCK_DEFINITIONS)
    );
  });

  afterEach(() => {
    document.body
      .querySelectorAll(".p-select-overlay")
      .forEach((el) => el.remove());
  });

  it("renders the environment definition dropdown", async () => {
    await renderComponent();

    expect(screen.getByTestId("environment-definition-dropdown")).toBeTruthy();
  });

  it("shows the default placeholder initially", async () => {
    mockEnvironmentService.getEnvironmentDefinitions.mockReturnValue(of([]));
    await renderComponent();

    expect(screen.getByText("Select environment definition")).toBeTruthy();
  });

  it("calls getEnvironmentDefinitions with the provided projectId", async () => {
    await renderComponent({ projectId: "proj-abc" });

    expect(
      mockEnvironmentService.getEnvironmentDefinitions
    ).toHaveBeenCalledWith("proj-abc");
  });

  it("maps definitions to options with name as label", async () => {
    const { fixture } = await renderComponent();

    const options =
      fixture.componentInstance["stateProvider"].dropdownOptions();

    expect(options[0].label).toBe("Production");
  });

  it("maps definitions to options with the EnvironmentDefinition as value", async () => {
    const { fixture } = await renderComponent();

    const options =
      fixture.componentInstance["stateProvider"].dropdownOptions();

    expect(options[0].value).toEqual(MOCK_DEFINITIONS[0]);
  });
});
