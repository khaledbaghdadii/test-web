import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { Store } from "@ngrx/store";
import {
  ScenarioDefinitionApiResponse,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import {
  EnvironmentDefinitionStatus,
  ScenarioDefinitionActivityStatus,
  TestDefinition,
} from "@mxevolve/domains/test/model";
import { ToastMessageService } from "@mxflow/ui/alert";
import { StreamsService } from "@mxflow/features/streams";
import {
  EnvironmentDefinitionNameComponent,
  EnvironmentService,
} from "@mxflow/features/environment";
import { MockComponent, MockDirective, MockModule, ngMocks } from "ng-mocks";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { ScenarioDefinitionTableComponent } from "./scenario-definition-table.component";
import { ScenarioFilterPipe } from "./pipe/scenario-filter.pipe";
import { FormsModule } from "@angular/forms";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { RouterLink } from "@angular/router";
import { TableModule } from "primeng/table";
import { SkeletonModule } from "primeng/skeleton";
import { MXEvolveShowMoreLessModule } from "@mxflow/ui/utils";
import { SelectButtonModule } from "primeng/selectbutton";
import { TooltipModule } from "primeng/tooltip";
import { ArchiveScenarioDefinitionButtonComponent } from "@mxevolve/domains/test/widget";
import { Divider } from "primeng/divider";
import { waitFor } from "@testing-library/dom";
import { By } from "@angular/platform-browser";

const MOCK_IMPORTS = [
  FormsModule,
  MockModule(CardContainerModule),
  MockModule(HeaderTitleModule),
  IconField,
  InputIcon,
  InputTextModule,
  ButtonModule,
  MockDirective(RouterLink),
  TableModule,
  SkeletonModule,
  ScenarioFilterPipe,
  MockModule(MXEvolveShowMoreLessModule),
  MockComponent(EnvironmentDefinitionNameComponent),
  SelectButtonModule,
  TooltipModule,
  MockComponent(ArchiveScenarioDefinitionButtonComponent),
  Divider,
  MockDirective(ShowElementIfAuthorizedDirective),
];

const mockScenarioDefinitionResponses: ScenarioDefinitionApiResponse[] = [
  {
    id: "1",
    projectId: "PROJECT_ID",
    name: "Scenario1",
    tests: [{ testDefinitionId: "td1", full: true, testSelectionIds: [] }],
    bpcs: [],
    environmentDefinitionId: "env1",
    heaviness: "NA",
    idempotent: false,
    nonFunctionalTest: false,
    archived: false,
  },
  {
    id: "2",
    projectId: "PROJECT_ID",
    name: "Scenario2",
    tests: [
      { testDefinitionId: "td2", full: false, testSelectionIds: ["ts1"] },
    ],
    bpcs: [],
    environmentDefinitionId: "env2",
    heaviness: "NA",
    idempotent: false,
    nonFunctionalTest: false,
    archived: false,
  },
];

const mockTestDefinitions: TestDefinition[] = [
  {
    name: "Test1",
    id: "td1",
    projectId: "",
    repoId: "",
    path: "",
    timeoutDuration: { days: 0, hours: 0, minutes: 0 },
    testSelections: [],
    description: "",
  },
  {
    name: "Test2",
    id: "td2",
    projectId: "",
    repoId: "",
    path: "",
    timeoutDuration: { days: 0, hours: 0, minutes: 0 },
    testSelections: [
      { name: "TestSelection1", id: "ts1", path: "", tags: ["tag1"] },
    ],
    description: "",
  },
];

const mockEnvironmentDefinitions = [
  {
    id: "env1",
    name: "Environment1",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
  {
    id: "env2",
    name: "Environment2",
    status: EnvironmentDefinitionStatus.ACTIVE,
  },
];

const mockScenarioDefinitionService = {
  getScenarioDefinitions: jest.fn(),
  getTestDefinitions: jest.fn(),
  archiveScenarioDefinition: jest.fn(),
};

const mockStore = {
  select: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
  showSuccess: jest.fn(),
};

const mockStreamsService = {
  getListOfBpcsByProjectId: jest.fn(),
};

const mockEnvironmentService = {
  getEnvironmentDefinitions: jest.fn(),
};

async function renderComponent() {
  const result = await render(ScenarioDefinitionTableComponent, {
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: ScenarioDefinitionService,
        useValue: mockScenarioDefinitionService,
      },
      { provide: Store, useValue: mockStore },
      { provide: ToastMessageService, useValue: mockToastMessageService },
      { provide: StreamsService, useValue: mockStreamsService },
      { provide: EnvironmentService, useValue: mockEnvironmentService },
    ],
  });

  renderShowIfAuthorizedDirectives();
  result.fixture.detectChanges();

  return result;
}

function renderShowIfAuthorizedDirectives() {
  const showElementIfAuthorizedDirectives = ngMocks.findInstances(
    ShowElementIfAuthorizedDirective
  );
  showElementIfAuthorizedDirectives.forEach((authDirective) =>
    ngMocks.render(authDirective, authDirective)
  );
}

function getDataRows() {
  return screen
    .queryAllByRole("row")
    .filter((row) => row.querySelectorAll("td").length > 0);
}

describe("ScenarioDefinitionTableComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
      of(mockScenarioDefinitionResponses)
    );
    mockScenarioDefinitionService.getTestDefinitions.mockReturnValue(
      of(mockTestDefinitions)
    );
    mockScenarioDefinitionService.archiveScenarioDefinition.mockReturnValue(
      of(undefined)
    );
    mockStore.select.mockReturnValue(of("PROJECT_ID"));
    mockStreamsService.getListOfBpcsByProjectId.mockReturnValue(of([]));
    mockEnvironmentService.getEnvironmentDefinitions.mockReturnValue(
      of(mockEnvironmentDefinitions)
    );
  });

  describe("initialization", () => {
    it("fetches and displays scenario definitions on init", async () => {
      await renderComponent();

      await waitFor(() => {
        const firstRowScenarioName = getDataRows()[0].querySelectorAll("td");
        expect(firstRowScenarioName[0].textContent).toContain("Scenario1");
        const secondRowScenarioName = getDataRows()[1].querySelectorAll("td");
        expect(secondRowScenarioName[0].textContent).toContain("Scenario2");
      });
    });

    it("renders a row for each scenario definition", async () => {
      mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
        of(mockScenarioDefinitionResponses)
      );
      await renderComponent();
      await waitFor(() => expect(getDataRows()).toHaveLength(2));
    });

    it("calls the scenario definition service with ACTIVE status", async () => {
      await renderComponent();

      expect(
        mockScenarioDefinitionService.getScenarioDefinitions
      ).toHaveBeenCalledWith(
        "PROJECT_ID",
        ScenarioDefinitionActivityStatus.ACTIVE
      );
    });

    it("displays error message on failure to fetch project id from store", async () => {
      mockStore.select.mockReturnValue(throwError(() => "error"));

      await renderComponent();

      expect(mockToastMessageService.showError).toHaveBeenCalledWith("error");
    });

    it("displays error message on failure to fetch scenario definitions", async () => {
      mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
        throwError(() => "error")
      );

      await renderComponent();

      expect(mockToastMessageService.showError).toHaveBeenCalledWith("error");
    });
  });

  describe("activity status switching", () => {
    it("select button is rendered", async () => {
      await renderComponent();
      expect(screen.getByRole("button", { name: "Unarchived" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Archived" })).toBeTruthy();
    });

    it("fetches archived scenario definitions when switching to archived view", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Archived" }));

      expect(
        mockScenarioDefinitionService.getScenarioDefinitions
      ).toHaveBeenCalledWith(
        "PROJECT_ID",
        ScenarioDefinitionActivityStatus.INACTIVE
      );
    });

    it("fetches active scenario definitions when switching back to unarchived view", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Archived" }));
      mockScenarioDefinitionService.getScenarioDefinitions.mockClear();
      await user.click(screen.getByRole("button", { name: "Unarchived" }));

      expect(
        mockScenarioDefinitionService.getScenarioDefinitions
      ).toHaveBeenCalledWith(
        "PROJECT_ID",
        ScenarioDefinitionActivityStatus.ACTIVE
      );
    });

    it("updates scenario definitions list after switching to archived view", async () => {
      const archivedResponses: ScenarioDefinitionApiResponse[] = [
        {
          id: "3",
          projectId: "PROJECT_ID",
          name: "ArchivedScenario",
          tests: [],
          bpcs: [],
          environmentDefinitionId: "env1",
          heaviness: "NA",
          idempotent: false,
          nonFunctionalTest: false,
          archived: true,
        },
      ];
      const user = userEvent.setup();
      await renderComponent();

      mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
        of(archivedResponses)
      );
      await user.click(screen.getByRole("button", { name: "Archived" }));

      await waitFor(() => {
        const rows = getDataRows();
        expect(rows).toHaveLength(1);
        expect(rows[0].querySelectorAll("td")[0].textContent).toContain(
          "ArchivedScenario"
        );
        expect(screen.queryByText("Scenario1")).toBeNull();
      });
    });

    it("hides edit button when viewing archived scenario definitions", async () => {
      const user = userEvent.setup();
      await renderComponent();

      expect(
        screen.queryAllByTestId("edit-scenario-definition").length
      ).toBeGreaterThan(0);

      mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
        of([
          {
            id: "3",
            projectId: "PROJECT_ID",
            name: "ArchivedScenario",
            tests: [],
            bpcs: [],
            environmentDefinitionId: "env1",
            heaviness: "NA",
            idempotent: false,
            nonFunctionalTest: false,
            archived: true,
          },
        ])
      );
      await user.click(screen.getByRole("button", { name: "Archived" }));

      expect(screen.queryAllByTestId("edit-scenario-definition")).toHaveLength(
        0
      );
    });

    it("hides archive button when viewing archived scenario definitions", async () => {
      const user = userEvent.setup();
      await renderComponent();

      expect(
        screen.queryAllByTestId("archive-scenario-definition-button").length
      ).toBeGreaterThan(0);

      mockScenarioDefinitionService.getScenarioDefinitions.mockReturnValue(
        of([
          {
            id: "3",
            projectId: "PROJECT_ID",
            name: "ArchivedScenario",
            tests: [],
            bpcs: [],
            environmentDefinitionId: "env1",
            heaviness: "NA",
            idempotent: false,
            nonFunctionalTest: false,
            archived: true,
          },
        ])
      );
      await user.click(screen.getByRole("button", { name: "Archived" }));

      expect(
        screen.queryAllByTestId("archive-scenario-definition-button")
      ).toHaveLength(0);
    });
  });

  describe("search", () => {
    it("allows typing into the search input", async () => {
      const user = userEvent.setup();
      await renderComponent();

      const searchInput =
        screen.getByPlaceholderText<HTMLInputElement>("Search");
      await user.type(searchInput, "scenario1");

      expect(searchInput.value).toBe("scenario1");
    });
  });

  describe("create scenario definition button", () => {
    it("renders the create button", async () => {
      await renderComponent();

      expect(screen.getByRole("button", { name: "Create new" })).toBeTruthy();
    });
  });

  describe("authorization", () => {
    it("create button has the correct authorization", async () => {
      const { fixture } = await renderComponent();

      const createButton = fixture.debugElement.query(
        (el) => el.nativeElement.getAttribute("label") === "Create new"
      );
      const directive = ngMocks.findInstance(
        createButton,
        ShowElementIfAuthorizedDirective
      );

      expect(directive.showElementIfAuthorized).toEqual({
        action: "create",
        attributes: {},
        package: "test",
        resource: "scenario_definition",
      });
    });

    it("edit button has the correct authorization", async () => {
      const { fixture } = await renderComponent();

      const editButton = fixture.debugElement.query(
        By.css('[data-testid="edit-scenario-definition"]')
      );
      const directive = ngMocks.findInstance(
        editButton,
        ShowElementIfAuthorizedDirective
      );

      expect(directive.showElementIfAuthorized).toEqual({
        action: "edit",
        attributes: {},
        package: "test",
        resource: "scenario_definition",
      });
    });

    it("archive button has the correct authorization", async () => {
      const { fixture } = await renderComponent();

      const archiveButton = fixture.debugElement.query(
        By.css('[data-testid="archive-scenario-definition-button"]')
      );
      const directive = ngMocks.findInstance(
        archiveButton,
        ShowElementIfAuthorizedDirective
      );

      expect(directive.showElementIfAuthorized).toEqual({
        action: "archive",
        attributes: {},
        package: "test",
        resource: "scenario_definition",
      });
    });
  });

  describe("onScenarioDefinitionArchived", () => {
    it("removes the archived scenario definition from the list", async () => {
      const { fixture } = await renderComponent();

      fixture.componentInstance.onScenarioDefinitionArchived("1");
      fixture.detectChanges();

      expect(screen.queryByText("Scenario1")).toBeNull();
      expect(screen.getByText("Scenario2")).toBeTruthy();
    });

    it("does not remove any scenario definition if id does not match", async () => {
      const { fixture } = await renderComponent();

      fixture.componentInstance.onScenarioDefinitionArchived("non-existent-id");
      fixture.detectChanges();

      expect(screen.getByText("Scenario1")).toBeTruthy();
      expect(screen.getByText("Scenario2")).toBeTruthy();
    });
  });
});
