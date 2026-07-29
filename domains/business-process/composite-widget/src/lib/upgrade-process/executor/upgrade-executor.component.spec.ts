import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { Type } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import {
  BusinessProcessDefinition,
  UpgradeProcessDefinitionExecutorService,
} from "@mxevolve/domains/business-process/data-access";
import {
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  UpgradePrefilledInputsComponent,
} from "@mxevolve/domains/business-process/widget";
import { EnvironmentDefinitionSelectorComponent } from "@mxevolve/domains/environment/widget";
import {
  RepositorySelectorComponent,
  BranchInputComponent,
} from "@mxevolve/domains/scm/widget";
import {
  ScenarioDefinitionDropdownComponent,
  ScenarioDefinitionMultiselectDropdownComponent,
} from "@mxevolve/domains/test/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  BranchService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { EnvironmentDefinitionService } from "@mxevolve/domains/environment/data-access";
import { FactoryProductApiService } from "@mxevolve/domains/artifact/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { UpgradeFactoryProductInputComponent } from "./factory-product-input/upgrade-factory-product-input.component";
import { UpgradeExecutorComponent } from "./upgrade-executor.component";

function simulateCvaChange<T>(component: Type<unknown>, value: T): void {
  const instance = ngMocks.find(component).componentInstance as unknown as {
    __simulateChange?: (value: T) => void;
  };
  if (!instance.__simulateChange) {
    throw new Error("Mocked component is not a ControlValueAccessor");
  }
  instance.__simulateChange(value);
}

const COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  InputText,
  RadioButton,
  Select,
  Button,
  MockComponent(UpgradePrefilledInputsComponent),
  MockComponent(InfraGroupSelectorComponent),
  MockComponent(NotificationsRecipientsInputComponent),
  MockComponent(UpgradeFactoryProductInputComponent),
  MockComponent(EnvironmentDefinitionSelectorComponent),
  MockComponent(RepositorySelectorComponent),
  MockComponent(BranchInputComponent),
  MockComponent(ScenarioDefinitionDropdownComponent),
  MockComponent(ScenarioDefinitionMultiselectDropdownComponent),
  DefinitionInputComponent,
];

const mockRepositoryService = { getRepository: jest.fn() };
const mockScenarioService = { getScenarioDefinitionById: jest.fn() };
const mockEnvironmentDefinitionService = {
  getEnvironmentDefinitionById: jest.fn(),
};
const mockFactoryProductService = { getFactoryProductById: jest.fn() };
const mockInfraGroupService = { getGroup: jest.fn() };
const mockBranchService = { getBranchDetails: jest.fn() };

/** Services the executor resolves pre-filled values against (VAL-27132 W1). */
const PREFILL_PROVIDERS = [
  { provide: RepositoryService, useValue: mockRepositoryService },
  { provide: ScenarioDefinitionService, useValue: mockScenarioService },
  {
    provide: EnvironmentDefinitionService,
    useValue: mockEnvironmentDefinitionService,
  },
  { provide: FactoryProductApiService, useValue: mockFactoryProductService },
  { provide: InfraGroupService, useValue: mockInfraGroupService },
  { provide: BranchService, useValue: mockBranchService },
];

function stubPrefillsResolve(): void {
  mockRepositoryService.getRepository.mockReturnValue(of({ id: "repo-1" }));
  mockScenarioService.getScenarioDefinitionById.mockReturnValue(
    of({ id: "scenario-1" })
  );
  mockEnvironmentDefinitionService.getEnvironmentDefinitionById.mockReturnValue(
    of({ id: "env-def-1" })
  );
  mockFactoryProductService.getFactoryProductById.mockReturnValue(
    of({ id: "fp-1" })
  );
  mockInfraGroupService.getGroup.mockReturnValue(of({ id: "group-1" }));
  mockBranchService.getBranchDetails.mockReturnValue(
    of({ latestCommitId: "commit-1" })
  );
}

const CONVERSION_FACTORY_PRODUCT = {
  id: "fp-1",
  mxVersion: "mx-1",
  mxBuildId: "build-1",
  bipVersion: "bip-1",
  bipBuildId: "bip-build-1",
};

const REFERENCE_FACTORY_PRODUCT = {
  id: "ref-fp-1",
  mxVersion: "ref-mx-1",
  mxBuildId: "ref-build-1",
  bipVersion: "ref-bip-1",
  bipBuildId: "ref-bip-build-1",
};

/** Every prefilled MX/config/infra/test/reference input, leaving only name + official user-entered. */
const FULLY_PREFILLED_INPUTS = [
  { inputId: "factoryProduct", value: CONVERSION_FACTORY_PRODUCT },
  { inputId: "parentMxArchivalBranch", value: "Archival-000001" },
  { inputId: "upgradeJump", value: "MINOR" },
  { inputId: "repositoryId", value: "repo-1" },
  { inputId: "businessProcessQualityLevel", value: "MQG" },
  { inputId: "createBranch", value: "false" },
  { inputId: "configurationBranchName", value: "config-branch" },
  { inputId: "configurationParentBranch", value: "config-parent" },
  { inputId: "qualityGateExecutionInfraGroupId", value: "qg-infra" },
  { inputId: "binaryConversionInfraGroupId", value: "bc-infra" },
  { inputId: "testScenarioIds", value: ["scenario-1", "scenario-2"] },
  { inputId: "technicalUpgradeTestScenarioId", value: "bc-scenario" },
  { inputId: "referenceCommitId", value: "ref-commit" },
  { inputId: "referenceFactoryProduct", value: REFERENCE_FACTORY_PRODUCT },
  { inputId: "referenceEnvironmentDefinitionId", value: "ref-env-def" },
  { inputId: "referenceEnvironmentInfraGroupId", value: "ref-infra" },
];

const mockExecutorService = {
  executeUpgradeProcessDefinition: jest.fn(),
};

const mockToastService = {
  showError: jest.fn(),
};

function definition(
  providedInputs: { inputId: string; value: unknown }[] = []
): BusinessProcessDefinition {
  return {
    id: "def-1",
    name: "Binary Upgrade",
    description: "Upgrade",
    sourceDefinitionId: "binary-upgrade",
    providedInputs,
    family: { id: "binary-upgrade", name: "Upgrade" },
  };
}

async function renderComponent(
  providedInputs: { inputId: string; value: unknown }[] = []
) {
  mockExecutorService.executeUpgradeProcessDefinition.mockReturnValue(
    of({ upgradeProcessExecutionId: "exec-1" })
  );

  return render(UpgradeExecutorComponent, {
    inputs: { projectId: "project-1", definition: definition(providedInputs) },
    componentImports: COMPONENT_IMPORTS,
    componentProviders: [
      {
        provide: UpgradeProcessDefinitionExecutorService,
        useValue: mockExecutorService,
      },
      ...PREFILL_PROVIDERS,
    ],
    providers: [
      { provide: ToastMessageService, useValue: mockToastService },
      ...PREFILL_PROVIDERS,
    ],
  });
}

function buildButton(): HTMLElement {
  return screen.getByRole("button", { name: "Build" });
}

describe("UpgradeExecutorComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubPrefillsResolve();
  });

  describe("required-field markers", () => {
    it("renders the mandatory-field legend", async () => {
      await renderComponent();

      expect(screen.getByText("* Mandatory Field")).toBeTruthy();
    });

    it("marks required fields with an asterisk and leaves optional fields unmarked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      simulateCvaChange(RepositorySelectorComponent, "repo-1");
      fixture.detectChanges();
      await user.click(screen.getByLabelText("Yes"));

      for (const label of [
        "Official Status",
        "Execution Name",
        "Parent MX Archival Branch",
        "Upgrade Jump",
        "Repository",
        "Business Process Quality Level",
        "Create Branch?",
        "Configuration Branch Name",
        "Configuration Parent Branch",
        "Quality Gate Execution Infra Group",
        "Binary Conversion Infra Group",
        "Quality Gate Execution Test Scenarios",
        "Binary Conversion Test Scenario",
        "Reference Commit ID",
        "Reference Environment Definition",
        "Reference Environment Infra Group",
      ]) {
        expect(screen.getByText(label).classList.contains("required")).toBe(
          true
        );
      }

      expect(
        screen
          .getByText("Expiry Date Notification Recipients")
          .classList.contains("required")
      ).toBe(false);
    });
  });

  describe("field presence", () => {
    it("hides Create Branch until a repository is selected, and the branch fields until Create Branch is chosen", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      expect(screen.queryByText("Create Branch?")).toBeNull();
      expect(screen.queryByText("Configuration Branch Name")).toBeNull();
      expect(screen.queryByText("Configuration Parent Branch")).toBeNull();

      simulateCvaChange(RepositorySelectorComponent, "repo-1");
      fixture.detectChanges();

      expect(screen.getByText("Create Branch?")).toBeTruthy();
      expect(screen.queryByText("Configuration Branch Name")).toBeNull();
      expect(screen.queryByText("Configuration Parent Branch")).toBeNull();

      await user.click(screen.getByLabelText("Yes"));

      expect(screen.getByText("Configuration Branch Name")).toBeTruthy();
      expect(screen.getByText("Configuration Parent Branch")).toBeTruthy();
    });

    it("shows every non-prefilled field grouped under its section heading", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      simulateCvaChange(RepositorySelectorComponent, "repo-1");
      fixture.detectChanges();
      await user.click(screen.getByLabelText("Yes"));

      expect(screen.getByLabelText("Official Execution")).toBeTruthy();
      expect(screen.getByLabelText("Unofficial Execution")).toBeTruthy();
      expect(screen.getByLabelText("Execution Name")).toBeTruthy();

      expect(screen.getByText("MX Parameters")).toBeTruthy();
      expect(
        screen.getByText(
          "Select the factory product that you wish to validate your Quality Gate against"
        )
      ).toBeTruthy();
      expect(screen.getByLabelText("Parent MX Archival Branch")).toBeTruthy();
      expect(screen.getByText("Upgrade Jump")).toBeTruthy();

      expect(screen.getByText("Configuration Parameters")).toBeTruthy();
      expect(screen.getByText("Repository")).toBeTruthy();
      expect(
        document.querySelector("mxevolve-repository-selector")
      ).toBeTruthy();
      expect(screen.getByText("Business Process Quality Level")).toBeTruthy();
      expect(screen.getByText("Create Branch?")).toBeTruthy();
      expect(screen.getByText("Configuration Branch Name")).toBeTruthy();
      expect(screen.getByText("Configuration Parent Branch")).toBeTruthy();

      expect(screen.getByText("Infrastructure Parameters")).toBeTruthy();
      expect(
        screen.getByText("Quality Gate Execution Infra Group")
      ).toBeTruthy();
      expect(screen.getByText("Binary Conversion Infra Group")).toBeTruthy();
      expect(
        ngMocks.findAll(InfraGroupSelectorComponent).length
      ).toBeGreaterThanOrEqual(2);

      expect(screen.getByText("Tests")).toBeTruthy();
      expect(
        screen.getByText("Quality Gate Execution Test Scenarios")
      ).toBeTruthy();
      expect(screen.getByText("Binary Conversion Test Scenario")).toBeTruthy();

      expect(screen.getByText("Reference Environment Parameters")).toBeTruthy();
      expect(screen.getByLabelText("Reference Commit ID")).toBeTruthy();
      expect(screen.getByText("Reference Environment Definition")).toBeTruthy();
      expect(
        screen.getByText(
          "Select the factory product that you wish to use in your reference environment"
        )
      ).toBeTruthy();
      expect(
        screen.getByText("Reference Environment Infra Group")
      ).toBeTruthy();

      expect(screen.getByText("Notifications")).toBeTruthy();
      expect(
        ngMocks.find(NotificationsRecipientsInputComponent).componentInstance
      ).toBeTruthy();
      expect(buildButton()).toBeTruthy();
    });

    it("hides prefilled fields from the form and shows them read-only on the details panel", async () => {
      const user = userEvent.setup();
      await renderComponent(FULLY_PREFILLED_INPUTS);

      expect(screen.queryByLabelText("Parent MX Archival Branch")).toBeNull();
      expect(screen.queryByText("Repository")).toBeNull();
      expect(screen.queryByText("Configuration Branch Name")).toBeNull();
      expect(screen.queryByLabelText("Reference Commit ID")).toBeNull();
      expect(screen.queryByText("MX Parameters")).toBeNull();
      expect(screen.queryByText("Configuration Parameters")).toBeNull();
      expect(ngMocks.findAll(InfraGroupSelectorComponent)).toHaveLength(
        0
      );

      await user.click(
        screen.getByRole("button", { name: "Binary Upgrade Details" })
      );

      const prefilled = ngMocks.find(UpgradePrefilledInputsComponent);
      expect(ngMocks.input(prefilled, "providedInputs")).toEqual(
        FULLY_PREFILLED_INPUTS
      );
    });
  });

  describe("submit", () => {
    it("submits the exact legacy-mapped payload and emits created on success", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent(FULLY_PREFILLED_INPUTS);
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My upgrade run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));

      await waitFor(() => expect(buildButton()).toBeEnabled());
      await user.click(buildButton());

      expect(
        mockExecutorService.executeUpgradeProcessDefinition
      ).toHaveBeenCalledWith({
        projectId: "project-1",
        name: "My upgrade run",
        definitionId: "def-1",
        official: false,
        notificationsRecipients: undefined,
        mxParameters: {
          parentMxArchivalBranch: "Archival-000001",
          upgradeJump: "MINOR",
          conversionFactoryProduct: {
            id: "fp-1",
            mxVersion: "mx-1",
            mxBuildId: "build-1",
            bipVersion: "bip-1",
            bipBuildId: "bip-build-1",
          },
        },
        configurationParameters: {
          repositoryId: "repo-1",
          createBranch: false,
          configurationBranchName: "config-branch",
          configurationParentBranchName: "config-parent",
          businessProcessQualityLevel: "MQG",
        },
        infrastructureParameters: {
          qualityGateExecutionInfraGroupId: "qg-infra",
          binaryConversionInfraGroupId: "bc-infra",
        },
        testParameters: {
          binaryConversionScenarioDefinitionId: "bc-scenario",
          qualityGateScenarioDefinitionIds: ["scenario-1", "scenario-2"],
        },
        referenceEnvironmentParameters: {
          referenceCommitId: "ref-commit",
          referenceFactoryProduct: {
            id: "ref-fp-1",
            mxVersion: "ref-mx-1",
            mxBuildId: "ref-build-1",
            bipVersion: "ref-bip-1",
            bipBuildId: "ref-bip-build-1",
          },
          referenceEnvironmentDefinitionId: "ref-env-def",
          referenceEnvironmentInfraGroupId: "ref-infra",
        },
      });
      expect(created).toHaveBeenCalledWith("exec-1");
    });

    it("keeps the build button disabled until the form is valid", async () => {
      const user = userEvent.setup();
      await renderComponent(FULLY_PREFILLED_INPUTS);

      expect(buildButton()).toBeDisabled();

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My upgrade run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));

      await waitFor(() => expect(buildButton()).toBeEnabled());
    });

    it("shows an error toast and does not emit created when the execute call fails", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent(FULLY_PREFILLED_INPUTS);
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);
      mockExecutorService.executeUpgradeProcessDefinition.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My upgrade run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));
      await waitFor(() => expect(buildButton()).toBeEnabled());
      await user.click(buildButton());

      await waitFor(() =>
        expect(mockToastService.showError).toHaveBeenCalledWith("boom")
      );
      expect(created).not.toHaveBeenCalled();
    });
  });
});
