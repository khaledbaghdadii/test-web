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
  ValidationProcessExecutionFetcherService,
} from "@mxevolve/domains/business-process/data-access";
import {
  MultiPageDialogComponent,
  MultiPageDialogPageDirective,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { ValidationTemplatesDialogComponent } from "./validation-templates-dialog.component";
import { ValidationExecutorComponent } from "../executor/validation-executor.component";
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
  MockComponent(ValidationExecutorComponent),
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

function validationDefinition(
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
    family: { id: "master-validation", name: "Validation" },
  };
}

const DEFINITIONS: BusinessProcessDefinition[] = [
  validationDefinition("v1", "Master Validation", "master-validation"),
  validationDefinition("v2", "Initial RTP Greening", "initial-rtp-greening"),
  validationDefinition(
    "v3",
    "Incremental RTP Greening",
    "incremental-rtp-greening"
  ),
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

  const view = await render(ValidationTemplatesDialogComponent, {
    inputs: { projectId: "project-1" },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: BusinessProcessDefinitionService,
        useValue: mockDefinitionService,
      },
      {
        provide: ValidationProcessExecutionFetcherService,
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
    expect(screen.getByText("Master Validation")).toBeTruthy()
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

describe("ValidationTemplatesDialogComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads the executable and source definitions once each for validation", async () => {
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

  it("shows each validation template with its name and description", async () => {
    await renderAndOpen();

    expect(screen.getByText("Master Validation")).toBeTruthy();
    expect(screen.getByText("Master Validation description")).toBeTruthy();
  });

  it("renders a definition-details-link for each row with the project id and definition", async () => {
    await renderAndOpen();

    const links = definitionDetailsLinks();

    expect(links.map((link) => link.definition().name)).toEqual([
      "Master Validation",
      "Initial RTP Greening",
      "Incremental RTP Greening",
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
      "Master Validation",
      "Initial RTP Greening",
      "Incremental RTP Greening",
    ]);
  });

  it("filters the templates to the selected sub-family", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "Initial RTP Greening",
      value: "initial-rtp-greening",
    });

    await waitFor(() =>
      expect(screen.queryByText("Master Validation")).toBeNull()
    );
    expect(runButtons()).toHaveLength(1);
    expect(screen.getByText("Initial RTP Greening")).toBeTruthy();
  });

  it("shows every template again when the sub-family is reset to all", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.subFamilyChange.emit({
      label: "Initial RTP Greening",
      value: "initial-rtp-greening",
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

    subFamilyFilter().componentInstance.searchChange.emit("Initial");

    await waitFor(() => expect(runButtons()).toHaveLength(1));
    expect(screen.getByText("Initial RTP Greening")).toBeTruthy();
  });

  it("restores the templates when the search filter is cleared", async () => {
    await renderAndOpen();

    subFamilyFilter().componentInstance.searchChange.emit("Initial");
    await waitFor(() => expect(runButtons()).toHaveLength(1));

    subFamilyFilter().componentInstance.searchChange.emit("");

    await waitFor(() => expect(runButtons()).toHaveLength(3));
  });

  it("routes to the created validation execution", async () => {
    const user = userEvent.setup();
    const { fixture } = await renderAndOpen();

    await user.click(
      screen.getByRole("button", { name: "Run Master Validation" })
    );
    await waitFor(() =>
      expect(ngMocks.findInstance(ValidationExecutorComponent)).toBeTruthy()
    );

    fixture.componentInstance["onExecutorCreated"]("exec-1");

    await waitFor(() =>
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        "/",
        "app",
        "project-1",
        "validation-activity",
        "execution",
        "exec-1",
      ])
    );
  });

  it("opens the executor page titled with the template name when run is clicked", async () => {
    const user = userEvent.setup();
    await renderAndOpen();

    await user.click(
      screen.getByRole("button", { name: "Run Master Validation" })
    );

    await waitFor(() => expect(screen.getByLabelText("Back")).toBeTruthy());
    expect(screen.getAllByText("Master Validation").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^Run / })).toBeNull();
  });

  it("shows an error toast when the definitions fail to load", async () => {
    mockDefinitionService.getBusinessProcessDefinitions.mockReturnValue(
      throwError(() => new Error("load failed"))
    );

    await render(ValidationTemplatesDialogComponent, {
      inputs: { projectId: "project-1" },
      componentImports: MOCK_IMPORTS,
      componentProviders: [
        {
          provide: BusinessProcessDefinitionService,
          useValue: mockDefinitionService,
        },
        {
          provide: ValidationProcessExecutionFetcherService,
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

  /**
   * Closing or navigating away destroys the executor, and with it the
   * subscription watching an already-issued POST. The dialog therefore locks
   * itself while the executor reports that it is running.
   */
  describe("locking the dialog while a run is created", () => {
    async function openExecutor() {
      const user = userEvent.setup();
      const view = await renderAndOpen();
      await user.click(
        screen.getByRole("button", { name: "Run Master Validation" })
      );
      await waitFor(() =>
        expect(ngMocks.findInstance(ValidationExecutorComponent)).toBeTruthy()
      );
      return view;
    }

    it("lets the user navigate back before a run starts", async () => {
      await openExecutor();

      expect(screen.getByLabelText("Back")).toBeEnabled();
    });

    it("blocks navigating back while the run is being created", async () => {
      const { detectChanges } = await openExecutor();

      ngMocks
        .findInstance(ValidationExecutorComponent)
        .executingChange.emit(true);
      detectChanges();

      await waitFor(() => expect(screen.getByLabelText("Back")).toBeDisabled());
    });

    it("lets the user navigate back again once the run finishes", async () => {
      const { detectChanges } = await openExecutor();
      ngMocks
        .findInstance(ValidationExecutorComponent)
        .executingChange.emit(true);
      detectChanges();

      ngMocks
        .findInstance(ValidationExecutorComponent)
        .executingChange.emit(false);
      detectChanges();

      await waitFor(() => expect(screen.getByLabelText("Back")).toBeEnabled());
    });
  });

  describe("cancelling the executor", () => {
    it("returns to the template list when the executor is cancelled", async () => {
      const user = userEvent.setup();
      const { detectChanges } = await renderAndOpen();
      await user.click(
        screen.getByRole("button", { name: "Run Master Validation" })
      );
      await waitFor(() =>
        expect(ngMocks.findInstance(ValidationExecutorComponent)).toBeTruthy()
      );

      ngMocks.findInstance(ValidationExecutorComponent).cancelled.emit();
      detectChanges();

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Run Master Validation" })
        ).toBeTruthy()
      );
    });

    /**
     * Repush opens the executor directly, so the navigation stack holds a single
     * page and there is nothing to go back to - Cancel has to close the dialog.
     */
    it("closes the dialog when a repushed run is cancelled", async () => {
      const { fixture, detectChanges } = await renderAndOpen();
      mockExecutionFetcher.fetchExecution.mockReturnValue(
        of({ definitionId: "v1", input: {} })
      );
      mockDefinitionService.getBusinessProcessDefinition.mockReturnValue(
        of(DEFINITIONS[0])
      );

      fixture.componentInstance.openRepush("exec-1");
      detectChanges();
      await waitFor(() =>
        expect(ngMocks.findInstance(ValidationExecutorComponent)).toBeTruthy()
      );
      expect(screen.queryByLabelText("Back")).toBeNull();

      ngMocks.findInstance(ValidationExecutorComponent).cancelled.emit();
      detectChanges();

      await waitFor(() =>
        expect(
          document.querySelector("mxevolve-validation-executor")
        ).toBeNull()
      );
    });

    it("drops the busy lock when the executor page is left", async () => {
      const user = userEvent.setup();
      const { fixture, detectChanges } = await renderAndOpen();
      await user.click(
        screen.getByRole("button", { name: "Run Master Validation" })
      );
      await waitFor(() =>
        expect(ngMocks.findInstance(ValidationExecutorComponent)).toBeTruthy()
      );
      ngMocks
        .findInstance(ValidationExecutorComponent)
        .executingChange.emit(true);
      detectChanges();

      fixture.componentInstance["onPageChange"]("templates");
      detectChanges();

      expect(fixture.componentInstance["executorBusy"]()).toBe(false);
    });
  });
});
