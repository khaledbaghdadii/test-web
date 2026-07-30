import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { TableModule } from "primeng/table";
import { Button } from "primeng/button";
import { Router } from "@angular/router";
import {
  BuildAndTestExecutionsService,
  BusinessProcessDefinition,
  BusinessProcessDefinitionService,
} from "@mxevolve/domains/business-process/data-access";
import {
  MultiPageDialogComponent,
  MultiPageDialogPageDirective,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { BuildAndTestExecutorComponent } from "../executor/build-and-test-executor.component";
import { BackportExecutorComponent } from "../../backport/executor/backport-executor.component";
import { BuildAndTestTemplatesDialogComponent } from "./build-and-test-templates-dialog.component";
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
  MockComponent(BuildAndTestExecutorComponent),
  MockComponent(BackportExecutorComponent),
  MockComponent(MxevolveIconComponent),
  DefinitionDetailsLinkComponent,
  TableModule,
  Button,
];

const mockDefinitionService = {
  getBusinessProcessDefinitions: jest.fn(),
  getBusinessProcessDefinition: jest.fn(),
};

const mockExecutionsService = {
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

function buildAndTestDefinition(
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
    family: { id: "user-story-build-and-test", name: "Build & Test" },
  };
}

const DEFINITIONS: BusinessProcessDefinition[] = [
  buildAndTestDefinition(
    "d1",
    "Configuration Build & Test",
    "configuration-build-and-test"
  ),
  buildAndTestDefinition("d2", "RTP Enrichment", "rtp-enrichment"),
  buildAndTestDefinition("d3", "RTP Build", "rtp-build"),
  buildAndTestDefinition("d4", "RTP Test Adaptation", "rtp-test-adaptation"),
  buildAndTestDefinition("d5", "Technical Reseed", "technical-reseed"),
  buildAndTestDefinition("d6", "On Demand Backport", "on-demand-backport"),
  {
    id: "v1",
    name: "Master Validation",
    description: "validation description",
    providedInputs: [],
    family: { id: "master-validation", name: "Validation" },
  },
];

async function renderComponent(
  definitions: BusinessProcessDefinition[] = DEFINITIONS
) {
  mockDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
    of(definitions)
  );

  const view = await render(BuildAndTestTemplatesDialogComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: BusinessProcessDefinitionService,
        useValue: mockDefinitionService,
      },
      {
        provide: BuildAndTestExecutionsService,
        useValue: mockExecutionsService,
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
    expect(screen.getByText("Configuration Build & Test")).toBeTruthy()
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

describe("BuildAndTestTemplatesDialogComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads the executable and source definitions once each for build and test", async () => {
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

  it("shows each build and test template with its name and description", async () => {
    await renderAndOpen();

    expect(screen.getByText("Configuration Build & Test")).toBeTruthy();
    expect(
      screen.getByText("Configuration Build & Test description")
    ).toBeTruthy();
  });

  it("renders a definition-details-link for each row with the project id and definition", async () => {
    await renderAndOpen();

    const links = definitionDetailsLinks();

    expect(links.map((link) => link.definition().name)).toEqual([
      "Configuration Build & Test",
      "RTP Enrichment",
      "RTP Build",
      "RTP Test Adaptation",
      "Technical Reseed",
    ]);
    expect(links.every((link) => link.projectId() === "project-1")).toBe(true);
  });

  it("does not show templates from other families", async () => {
    await renderAndOpen();

    expect(screen.queryByText("Master Validation")).toBeNull();
  });

  it("paginates the templates table to five rows per page", async () => {
    await renderAndOpen();

    expect(runButtons()).toHaveLength(5);
  });

  it("passes the derived sub-family options to the filter", async () => {
    await renderAndOpen();

    const options = ngMocks.input(subFamilyFilter(), "options");

    expect(options.map((option) => option.label)).toEqual([
      "All",
      "Configuration Build & Test",
      "RTP Enrichment",
      "RTP Build",
      "RTP Test Adaptation",
      "Technical Reseed",
      "On Demand Backport",
    ]);
  });

  it("filters the templates to the selected sub-family", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "RTP Build",
      value: "rtp-build",
    });

    await waitFor(() =>
      expect(screen.queryByText("RTP Enrichment")).toBeNull()
    );
    expect(runButtons()).toHaveLength(1);
    expect(screen.getByText("RTP Build")).toBeTruthy();
  });

  it("shows every template again when the sub-family is reset to all", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "RTP Build",
      value: "rtp-build",
    });
    await waitFor(() => expect(runButtons()).toHaveLength(1));

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "All",
      value: "",
    });

    await waitFor(() => expect(runButtons()).toHaveLength(5));
  });

  it("filters the templates by the search term", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.searchChange.emit("Enrichment");

    await waitFor(() => expect(runButtons()).toHaveLength(1));
    expect(screen.getByText("RTP Enrichment")).toBeTruthy();
  });

  it("restores the templates when the search filter is cleared", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.searchChange.emit("Enrichment");
    await waitFor(() => expect(runButtons()).toHaveLength(1));

    subFamilyFilter().componentInstance.searchChange.emit("");

    await waitFor(() => expect(runButtons()).toHaveLength(5));
  });

  it("routes to the created execution from a new build", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderAndOpen();

    await user.click(
      screen.getByRole("button", { name: "Run Configuration Build & Test" })
    );
    await waitFor(() =>
      expect(ngMocks.findInstance(BuildAndTestExecutorComponent)).toBeTruthy()
    );

    fixture.componentInstance["onExecutorCreated"]("exec-1");

    await waitFor(() =>
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        "/",
        "app",
        "project-1",
        "build-and-test-activity",
        "execution",
        "exec-1",
      ])
    );
  });

  it("opens the executor page titled with the template name when run is clicked", async () => {
    const user = userEvent.setup();
    await renderAndOpen();

    await user.click(
      screen.getByRole("button", { name: "Run Configuration Build & Test" })
    );

    await waitFor(() => expect(screen.getByLabelText("Back")).toBeTruthy());
    expect(
      screen.getAllByText("Configuration Build & Test").length
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^Run / })).toBeNull();
  });

  it("opens the executor page pre-filled when a run is repushed", async () => {
    const view = await renderComponent();
    mockExecutionsService.fetchExecution.mockReturnValue(
      of({
        id: "exec-1",
        definitionId: "d1",
        name: "Build - 000001",
        input: { userStoryIds: ["VAL-1"], repositoryId: "repo-1" },
      })
    );
    mockDefinitionService.getBusinessProcessDefinition.mockReturnValue(
      of(DEFINITIONS[0])
    );

    view.fixture.componentInstance.openRepush("exec-1");
    view.detectChanges();

    await waitFor(() =>
      expect(ngMocks.findInstance(BuildAndTestExecutorComponent)).toBeTruthy()
    );
    expect(mockExecutionsService.fetchExecution).toHaveBeenCalledWith(
      "project-1",
      "exec-1"
    );
    expect(
      mockDefinitionService.getBusinessProcessDefinition
    ).toHaveBeenCalledWith("project-1", "d1");
  });

  it("shows an error toast when the definitions fail to load", async () => {
    mockDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
      throwError(() => new Error("load failed"))
    );

    await render(BuildAndTestTemplatesDialogComponent, {
      inputs: { projectId: "project-1" },
      componentImports: MOCK_IMPORTS,
      componentProviders: [
        {
          provide: BusinessProcessDefinitionService,
          useValue: mockDefinitionService,
        },
        {
          provide: BuildAndTestExecutionsService,
          useValue: mockExecutionsService,
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

  /**
   * Closing or navigating away destroys the executor, and with it the
   * subscription watching an already-issued POST. The dialog therefore locks
   * itself while the executor reports that it is running.
   */
  describe("locking the dialog while a run is created", () => {
    async function openExecutor() {
      const user = userEvent.setup();
      const view = await renderAndOpen();
      await user.click(screen.getByRole("button", { name: "Run Configuration Build & Test" }));
      await waitFor(() =>
        expect(ngMocks.findInstance(BuildAndTestExecutorComponent)).toBeTruthy()
      );
      return view;
    }

    it("lets the user navigate back before a run starts", async () => {
      await openExecutor();

      expect(screen.getByLabelText("Back")).toBeEnabled();
    });

    it("blocks navigating back while the run is being created", async () => {
      const { detectChanges } = await openExecutor();

      ngMocks.findInstance(BuildAndTestExecutorComponent).executingChange.emit(true);
      detectChanges();

      await waitFor(() => expect(screen.getByLabelText("Back")).toBeDisabled());
    });

    it("lets the user navigate back again once the run finishes", async () => {
      const { detectChanges } = await openExecutor();
      ngMocks.findInstance(BuildAndTestExecutorComponent).executingChange.emit(true);
      detectChanges();

      ngMocks.findInstance(BuildAndTestExecutorComponent).executingChange.emit(false);
      detectChanges();

      await waitFor(() => expect(screen.getByLabelText("Back")).toBeEnabled());
    });

    it("drops the busy lock when the executor page is left", async () => {
      const { fixture, detectChanges } = await openExecutor();
      ngMocks.findInstance(BuildAndTestExecutorComponent).executingChange.emit(true);
      detectChanges();

      fixture.componentInstance["onPageChange"]("templates");
      detectChanges();

      expect(fixture.componentInstance["executorBusy"]()).toBe(false);
    });
  });

  describe("cancelling the executor", () => {
    it("returns to the template list when the executor is cancelled", async () => {
      const user = userEvent.setup();
      const { detectChanges } = await renderAndOpen();
      await user.click(screen.getByRole("button", { name: "Run Configuration Build & Test" }));
      await waitFor(() =>
        expect(ngMocks.findInstance(BuildAndTestExecutorComponent)).toBeTruthy()
      );

      ngMocks.findInstance(BuildAndTestExecutorComponent).cancelled.emit();
      detectChanges();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Run Configuration Build & Test" })
        ).toBeTruthy()
      );
    });
  });

  /**
   * This dialog hosts two executors - Backport is selected for the
   * `on-demand-backport` sub-family - and each is wired to the dialog
   * separately, so the lock and Cancel have to hold for that one too.
   */
  describe("the backport executor", () => {
    async function openBackportExecutor() {
      const user = userEvent.setup();
      const view = await renderAndOpen();
      // The backport template sits on the second page of the table, so narrow
      // to its sub-family rather than paging through.
      subFamilyFilter().componentInstance.subFamilyChange.emit({
        label: "On Demand Backport",
        value: "on-demand-backport",
      });
      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Run On Demand Backport" })
        ).toBeTruthy()
      );
      await user.click(
        screen.getByRole("button", { name: "Run On Demand Backport" })
      );
      await waitFor(() =>
        expect(ngMocks.findInstance(BackportExecutorComponent)).toBeTruthy()
      );
      return view;
    }

    it("opens the backport executor rather than the build-and-test one", async () => {
      await openBackportExecutor();

      expect(
        document.querySelector("mxevolve-build-and-test-executor")
      ).toBeNull();
    });

    it("blocks navigating back while a backport run is being created", async () => {
      const { detectChanges } = await openBackportExecutor();

      ngMocks.findInstance(BackportExecutorComponent).executingChange.emit(true);
      detectChanges();

      await waitFor(() => expect(screen.getByLabelText("Back")).toBeDisabled());
    });

    it("returns to the template list when the backport executor is cancelled", async () => {
      const { detectChanges } = await openBackportExecutor();

      ngMocks.findInstance(BackportExecutorComponent).cancelled.emit();
      detectChanges();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Run On Demand Backport" })
        ).toBeTruthy()
      );
    });
  });
});
