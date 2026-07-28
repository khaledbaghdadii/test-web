import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { TableModule } from "primeng/table";
import { Button } from "primeng/button";
import { Router } from "@angular/router";
import {
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
  ExecutionFetcherService,
} from "@mxevolve/domains/business-process/data-access";
import {
  MultiPageDialogComponent,
  MultiPageDialogPageDirective,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { UpgradeTemplatesDialogComponent } from "./upgrade-templates-dialog.component";
import { UpgradeExecutorComponent } from "../executor/upgrade-executor.component";
import { TemplatesSubFamilyFilterComponent } from "../../shared/templates-sub-family-filter/templates-sub-family-filter.component";
import { DefinitionDetailsLinkComponent } from "../../shared/definition-details-link/definition-details-link.component";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const MOCK_IMPORTS = [
  MultiPageDialogComponent,
  MultiPageDialogPageDirective,
  MockComponent(TemplatesSubFamilyFilterComponent),
  MockComponent(UpgradeExecutorComponent),
  MockComponent(MxevolveIconComponent),
  DefinitionDetailsLinkComponent,
  TableModule,
  Button,
];

const mockDefinitionService = {
  getBusinessProcessDefinitions: jest.fn(),
  getBusinessProcessDefinition: jest.fn(),
};

const mockExecutionFetcher = {
  fetchExecution: jest.fn(),
};

const mockToastService = {
  showError: jest.fn(),
};

const mockRouter = {
  navigate: jest.fn().mockResolvedValue(true),
  createUrlTree: jest.fn(() => ({})),
  serializeUrl: jest.fn(() => "/business-process-url"),
  routerState: { root: {} },
};

function upgradeDefinition(
  id: string,
  name: string,
  sourceDefinitionId: string
): BusinessProcessDefinition {
  return {
    id,
    name,
    description: `${name} description`,
    sourceDefinitionId,
    providedInputs: [],
    family: { id: "binary-upgrade", name: "Upgrade" },
  };
}

const DEFINITIONS: BusinessProcessDefinition[] = [
  upgradeDefinition("u1", "Continuous RTP Greening", "continuous-rtp-greening"),
  upgradeDefinition("u2", "Patch Upgrade", "patch-upgrade"),
  upgradeDefinition("u3", "Subsequent RTP Greening", "subsequent-rtp-greening"),
  {
    id: "b1",
    name: "Configuration Build & Test",
    description: "build description",
    providedInputs: [],
    family: { id: "user-story-build-and-test", name: "Build & Test" },
  },
];

async function renderComponent(
  definitions: BusinessProcessDefinition[] = DEFINITIONS
) {
  mockDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
    of(definitions)
  );

  const view = await render(UpgradeTemplatesDialogComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: BusinessProcessDefinitionService,
        useValue: mockDefinitionService,
      },
      {
        provide: ExecutionFetcherService,
        useValue: mockExecutionFetcher,
      },
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastService },
      { provide: Router, useValue: mockRouter },
    ],
  });

  view.fixture.componentInstance.open();
  view.detectChanges();

  return view;
}

async function renderAndOpen(
  definitions: BusinessProcessDefinition[] = DEFINITIONS
) {
  const view = await renderComponent(definitions);
  await waitFor(() =>
    expect(screen.getByText("Continuous RTP Greening")).toBeTruthy()
  );
  return view;
}

function runButtons(): HTMLElement[] {
  return screen.getAllByRole("button", {
    name: /^Run /,
  });
}

function subFamilyFilter() {
  return ngMocks.find(TemplatesSubFamilyFilterComponent);
}

function definitionDetailsLinks() {
  return ngMocks.findInstances(DefinitionDetailsLinkComponent);
}

describe("UpgradeTemplatesDialogComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads the executable and source definitions once each for upgrade", async () => {
    await renderAndOpen();

    expect(
      mockDefinitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledTimes(2);
    expect(
      mockDefinitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledWith({
      projectId: "project-1",
      extendable: false,
      executable: true,
    });
    expect(
      mockDefinitionService.getBusinessProcessDefinitions
    ).toHaveBeenCalledWith({
      projectId: "project-1",
      extendable: true,
    });
  });

  it("shows each upgrade template with its name and description", async () => {
    await renderAndOpen();

    expect(screen.getByText("Continuous RTP Greening")).toBeTruthy();
    expect(
      screen.getByText("Continuous RTP Greening description")
    ).toBeTruthy();
  });

  it("renders a definition-details-link for each row with the project id and definition", async () => {
    await renderAndOpen();

    const links = definitionDetailsLinks();

    expect(links.map((link) => link.definition().name)).toEqual([
      "Continuous RTP Greening",
      "Patch Upgrade",
      "Subsequent RTP Greening",
    ]);
    expect(links.every((link) => link.projectId() === "project-1")).toBe(true);
  });

  it("does not show templates from other families", async () => {
    await renderAndOpen();

    expect(screen.queryByText("Configuration Build & Test")).toBeNull();
  });

  it("passes the derived sub-family options to the filter", async () => {
    await renderAndOpen();

    const options = ngMocks.input(subFamilyFilter(), "options");

    expect(options.map((option) => option.label)).toEqual([
      "All",
      "Continuous RTP Greening",
      "Patch Upgrade",
      "Subsequent RTP Greening",
    ]);
  });

  it("filters the templates to the selected sub-family", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "Patch Upgrade",
      value: "patch-upgrade",
    });

    await waitFor(() =>
      expect(screen.queryByText("Continuous RTP Greening")).toBeNull()
    );
    expect(runButtons()).toHaveLength(1);
    expect(screen.getByText("Patch Upgrade")).toBeTruthy();
  });

  it("shows every template again when the sub-family is reset to all", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "Patch Upgrade",
      value: "patch-upgrade",
    });
    await waitFor(() => expect(runButtons()).toHaveLength(1));

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "All",
      value: "",
    });

    await waitFor(() => expect(runButtons()).toHaveLength(3));
  });

  it("filters the templates by the search term", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.searchChange.emit("Patch");

    await waitFor(() => expect(runButtons()).toHaveLength(1));
    expect(screen.getByText("Patch Upgrade")).toBeTruthy();
  });

  it("restores the templates when the search filter is cleared", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.searchChange.emit("Patch");
    await waitFor(() => expect(runButtons()).toHaveLength(1));

    subFamilyFilter().componentInstance.searchChange.emit("");

    await waitFor(() => expect(runButtons()).toHaveLength(3));
  });

  it("routes to the created upgrade execution", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderAndOpen();

    await user.click(
      screen.getByRole("button", { name: "Run Continuous RTP Greening" })
    );
    await waitFor(() =>
      expect(ngMocks.findInstance(UpgradeExecutorComponent)).toBeTruthy()
    );

    fixture.componentInstance["onExecutorCreated"]("exec-1");

    await waitFor(() =>
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        "/",
        "app",
        "project-1",
        "upgrade-activity",
        "execution",
        "exec-1",
      ])
    );
  });

  it("opens the executor page titled with the template name when run is clicked", async () => {
    const user = userEvent.setup();
    await renderAndOpen();

    await user.click(
      screen.getByRole("button", { name: "Run Continuous RTP Greening" })
    );

    await waitFor(() => expect(screen.getByLabelText("Back")).toBeTruthy());
    expect(
      screen.getAllByText("Continuous RTP Greening").length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^Run / })).toBeNull();
  });

  it("shows an error toast when the definitions fail to load", async () => {
    mockDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
      throwError(() => new Error("load failed"))
    );

    await render(UpgradeTemplatesDialogComponent, {
      inputs: { projectId: "project-1" },
      componentImports: MOCK_IMPORTS,
      componentProviders: [
        {
          provide: BusinessProcessDefinitionService,
          useValue: mockDefinitionService,
        },
        {
          provide: ExecutionFetcherService,
          useValue: mockExecutionFetcher,
        },
      ],
      providers: [
        { provide: ToastMessageService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    await waitFor(() =>
      expect(mockToastService.showError).toHaveBeenCalledWith("load failed")
    );
  });
});
