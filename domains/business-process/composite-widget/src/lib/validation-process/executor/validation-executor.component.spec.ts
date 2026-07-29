import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { MockComponent } from "ng-mocks";
import { of, throwError } from "rxjs";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import {
  BusinessProcessDefinition,
  ValidationProcessExecutorService,
} from "@mxevolve/domains/business-process/data-access";
import {
  BranchService,
  DevelopmentService,
  RepositoryService,
} from "@mxevolve/domains/scm/data-access";
import { ScenarioDefinitionService } from "@mxevolve/domains/test/data-access";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { UserService } from "@mxevolve/domains/user/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import {
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  ValidationPrefilledInputsComponent,
} from "@mxevolve/domains/business-process/widget";
import { ScenarioDefinitionMultiselectDropdownComponent } from "@mxevolve/domains/test/widget";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ScopeStartCommitInputComponent } from "../scope-start-commit-input/scope-start-commit-input.component";
import { ValidationConfigurationParametersComponent } from "./configuration-parameters/validation-configuration-parameters.component";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ValidationExecutorComponent } from "./validation-executor.component";
import type { ValidationExecutorForm } from "./validation-executor.form";

const COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  DefinitionInputComponent,
  InputText,
  RadioButton,
  Select,
  Button,
  MxevolveIconComponent,
  MockComponent(ValidationPrefilledInputsComponent),
  MockComponent(InfraGroupSelectorComponent),
  MockComponent(NotificationsRecipientsInputComponent),
  MockComponent(ScenarioDefinitionMultiselectDropdownComponent),
  MockComponent(ValidationConfigurationParametersComponent),
  MockComponent(ScopeStartCommitInputComponent),
];

const SCOPE_FIELD_LABEL =
  "Please select the start of the validation scope from";

const mockExecutorService = {
  executeValidationProcessDefinition: jest.fn(),
};

const mockDevelopmentService = {
  getDevelopments: jest.fn(),
};

const mockBranchService = {
  getBranchDetails: jest.fn(),
};

const mockFinalProductApiService = {
  getFinalProducts: jest.fn(),
  getFinalProductById: jest.fn(),
};

const mockRepositoryService = { getRepository: jest.fn() };
const mockScenarioService = { getScenarioDefinitionById: jest.fn() };
const mockInfraGroupService = { getGroup: jest.fn() };

/** Services the executor resolves pre-filled values against (VAL-27132 W1). */
const mockUserService = { fetchUsersByEmails: jest.fn() };

const PREFILL_PROVIDERS = [
  { provide: UserService, useValue: mockUserService },
  { provide: RepositoryService, useValue: mockRepositoryService },
  { provide: ScenarioDefinitionService, useValue: mockScenarioService },
  { provide: InfraGroupService, useValue: mockInfraGroupService },
];

function stubPrefillsResolve(): void {
  mockUserService.fetchUsersByEmails.mockImplementation(
    (_projectId: string, emails: string[]) => of({ content: emails.map((mail) => ({ mail })) })
  );
  mockRepositoryService.getRepository.mockReturnValue(of({ id: "repo-1" }));
  mockScenarioService.getScenarioDefinitionById.mockReturnValue(
    of({ id: "scenario-1" })
  );
  mockInfraGroupService.getGroup.mockReturnValue(of({ id: "infra-1" }));
  mockFinalProductApiService.getFinalProductById.mockReturnValue(
    of({ id: "product-1" })
  );
}

const mockFeatureFlags = {
  isFeatureEnabled: jest.fn(),
};

const mockToastService = {
  showError: jest.fn(),
};

/** Every prefilled config/test/infra input, leaving only name + official + scope user-entered. */
const FULLY_PREFILLED_INPUTS = [
  { inputId: "repositoryId", value: "repo-1" },
  { inputId: "businessProcessQualityLevel", value: "MQG" },
  { inputId: "createBranch", value: "false" },
  { inputId: "archivalBranchName", value: "arch-1" },
  { inputId: "finalProductId", value: "product-1" },
  { inputId: "rtpCommitId", value: "rtp-1" },
  { inputId: "configCommitId", value: "config-1" },
  { inputId: "testScenarioIds", value: ["scenario-1"] },
  { inputId: "nightlyRepusherEnabled", value: true },
  { inputId: "qualityGateExecutionInfraGroupId", value: "infra-1" },
];

function definition(
  providedInputs: { inputId: string; value: unknown }[] = []
): BusinessProcessDefinition {
  return {
    id: "def-1",
    name: "Master Validation",
    description: "Validation",
    sourceDefinitionId: "master-validation",
    providedInputs,
    family: { id: "master-validation", name: "Validation" },
  };
}

interface RenderOptions {
  providedInputs?: { inputId: string; value: unknown }[];
  flagEnabled?: boolean;
  resolvedSource?: string | null;
}

async function renderComponent({
  providedInputs = [],
  flagEnabled = false,
  resolvedSource = null,
}: RenderOptions = {}) {
  mockExecutorService.executeValidationProcessDefinition.mockReturnValue(
    of({ id: "exec-1" })
  );
  mockFeatureFlags.isFeatureEnabled.mockResolvedValue(flagEnabled);
  mockDevelopmentService.getDevelopments.mockReturnValue(
    of({ content: resolvedSource === null ? [] : [{ source: resolvedSource }] })
  );
  mockBranchService.getBranchDetails.mockReturnValue(
    of({ latestCommitId: "head-commit-1" })
  );
  mockFinalProductApiService.getFinalProducts.mockReturnValue(
    of({
      content: [],
      size: 0,
      number: 0,
      totalPages: 0,
      totalElements: 0,
      last: true,
    })
  );

  return render(ValidationExecutorComponent, {
    inputs: { projectId: "project-1", definition: definition(providedInputs) },
    componentImports: COMPONENT_IMPORTS,
    componentProviders: [
      {
        provide: ValidationProcessExecutorService,
        useValue: mockExecutorService,
      },
      ...PREFILL_PROVIDERS,
    ],
    providers: [
      ...PREFILL_PROVIDERS,
      {
        provide: ValidationProcessExecutorService,
        useValue: mockExecutorService,
      },
      { provide: DevelopmentService, useValue: mockDevelopmentService },
      { provide: BranchService, useValue: mockBranchService },
      { provide: FinalProductApiService, useValue: mockFinalProductApiService },
      { provide: FeatureFlagResolver, useValue: mockFeatureFlags },
      { provide: ToastMessageService, useValue: mockToastService },
    ],
  });
}

function buildButton(): HTMLElement {
  return screen.getByRole("button", { name: "Run" });
}

describe("ValidationExecutorComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stubPrefillsResolve();
  });

  describe("required-field markers", () => {
    it("renders the mandatory-field legend", async () => {
      await renderComponent();

      expect(screen.getByText("* Mandatory Field")).toBeTruthy();
    });

    it("keeps the parent branch reachable once MQG create-branch makes it required", async () => {
      const { fixture } = await renderComponent({
        providedInputs: [{ inputId: "repositoryId", value: "repo-1" }],
      });
      const executor = fixture.componentInstance as unknown as {
        form: () => ValidationExecutorForm;
        visibility: () => Record<string, boolean>;
      };
      const controls = executor.form().controls;

      // The parent branch carries no validators when the form is built, so the
      // definition-only visibility snapshot says "hide". Choosing MQG +
      // create-branch makes it required - and a required field the user cannot
      // reach leaves the run permanently unsubmittable.
      expect(executor.visibility()["parentBranchName"]).toBe(false);

      controls.businessProcessQualityLevel.setValue("MQG");
      controls.createBranch.setValue(true);

      await waitFor(() =>
        expect(
          controls.parentBranchName.hasValidator(Validators.required)
        ).toBe(true)
      );
      expect(executor.visibility()["parentBranchName"]).toBe(true);
    });

    it("marks required fields with an asterisk and leaves optional fields unmarked", async () => {
      await renderComponent({
        providedInputs: [
          { inputId: "repositoryId", value: "repo-1" },
          { inputId: "businessProcessQualityLevel", value: "MQG" },
          { inputId: "createBranch", value: "true" },
          { inputId: "parentBranch", value: "parent-1" },
        ],
      });

      for (const label of [
        "Official Status",
        "Execution Name",
        "Do you want to enable nightly repush?",
        "Quality Gate Execution Infra Group",
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

  describe("validationScopeStartCommitId visibility matrix", () => {
    const scopeEnablingInputs = [
      { inputId: "repositoryId", value: "repo-1" },
      { inputId: "businessProcessQualityLevel", value: "MQG" },
      { inputId: "createBranch", value: "false" },
      { inputId: "archivalBranchName", value: "arch-1" },
    ];

    async function selectOfficial(): Promise<void> {
      const user = userEvent.setup();
      await user.click(screen.getByLabelText("Official Execution"));
    }

    it("shows the scope field when flag on + official + MQG + resolved parent + archival branch", async () => {
      await renderComponent({
        providedInputs: scopeEnablingInputs,
        flagEnabled: true,
        resolvedSource: "develop",
      });

      await selectOfficial();

      await waitFor(() =>
        expect(screen.getByText(SCOPE_FIELD_LABEL)).toBeTruthy()
      );
    });

    it("hides the scope field when the archival feature flag is disabled", async () => {
      await renderComponent({
        providedInputs: scopeEnablingInputs,
        flagEnabled: false,
        resolvedSource: "develop",
      });

      await selectOfficial();

      await waitFor(() =>
        expect(mockFeatureFlags.isFeatureEnabled).toHaveBeenCalled()
      );
      expect(screen.queryByText(SCOPE_FIELD_LABEL)).toBeNull();
    });

    it("hides the scope field for an unofficial execution", async () => {
      const user = userEvent.setup();
      await renderComponent({
        providedInputs: scopeEnablingInputs,
        flagEnabled: true,
        resolvedSource: "develop",
      });

      await user.click(screen.getByLabelText("Unofficial Execution"));

      await waitFor(() =>
        expect(mockFeatureFlags.isFeatureEnabled).toHaveBeenCalled()
      );
      expect(screen.queryByText(SCOPE_FIELD_LABEL)).toBeNull();
    });

    it("hides the scope field when the BP quality level is not MQG", async () => {
      await renderComponent({
        providedInputs: [
          { inputId: "repositoryId", value: "repo-1" },
          { inputId: "businessProcessQualityLevel", value: "DQG" },
          { inputId: "createBranch", value: "false" },
          { inputId: "archivalBranchName", value: "arch-1" },
        ],
        flagEnabled: true,
        resolvedSource: "develop",
      });

      await selectOfficial();

      await waitFor(() =>
        expect(mockFeatureFlags.isFeatureEnabled).toHaveBeenCalled()
      );
      expect(screen.queryByText(SCOPE_FIELD_LABEL)).toBeNull();
    });

    it("hides the scope field when no parent branch can be resolved", async () => {
      await renderComponent({
        providedInputs: scopeEnablingInputs,
        flagEnabled: true,
        resolvedSource: null,
      });

      await selectOfficial();

      await waitFor(() =>
        expect(mockDevelopmentService.getDevelopments).toHaveBeenCalled()
      );
      expect(screen.queryByText(SCOPE_FIELD_LABEL)).toBeNull();
    });

    it("shows the scope field when creating a branch with a parent branch chosen", async () => {
      await renderComponent({
        providedInputs: [
          { inputId: "repositoryId", value: "repo-1" },
          { inputId: "businessProcessQualityLevel", value: "MQG" },
          { inputId: "createBranch", value: "true" },
          { inputId: "parentBranch", value: "main" },
          { inputId: "archivalBranchName", value: "arch-1" },
        ],
        flagEnabled: true,
        resolvedSource: "develop",
      });

      await selectOfficial();

      await waitFor(() =>
        expect(screen.getByText(SCOPE_FIELD_LABEL)).toBeTruthy()
      );
    });

    it("resolves the parent branch from the SCM developments lookup", async () => {
      await renderComponent({
        providedInputs: scopeEnablingInputs,
        flagEnabled: true,
        resolvedSource: "develop",
      });

      await selectOfficial();

      await waitFor(() =>
        expect(mockDevelopmentService.getDevelopments).toHaveBeenCalledWith(
          "project-1",
          {
            repositoryId: "repo-1",
            name: "arch-1",
          }
        )
      );
    });
  });

  describe("submit", () => {
    it("submits the exact legacy payload and emits created on success", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        providedInputs: FULLY_PREFILLED_INPUTS,
      });
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My validation run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));

      await waitFor(() => expect(buildButton()).toBeEnabled());
      await user.click(buildButton());

      expect(
        mockExecutorService.executeValidationProcessDefinition
      ).toHaveBeenCalledWith("project-1", {
        name: "My validation run",
        definitionId: "def-1",
        official: false,
        notificationsRecipients: undefined,
        configurationParameters: {
          repositoryId: "repo-1",
          businessProcessQualityLevel: "MQG",
          createBranch: false,
          parentBranchName: undefined,
          archivalBranchName: "arch-1",
          configCommitId: "config-1",
          rtpCommitId: "rtp-1",
          finalProductId: "product-1",
        },
        testParameters: {
          qualityGateScenarioDefinitionIds: ["scenario-1"],
          nightlyRepusherEnabled: true,
        },
        infrastructureParameters: {
          qualityGateInfraGroupId: "infra-1",
        },
        validationScopeParameters: {
          startCommitId: null,
        },
      });
      expect(created).toHaveBeenCalledWith("exec-1");
    });

    it("keeps the build button disabled until the form is valid", async () => {
      const user = userEvent.setup();
      await renderComponent({ providedInputs: FULLY_PREFILLED_INPUTS });

      expect(buildButton()).toBeDisabled();

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My validation run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));

      await waitFor(() => expect(buildButton()).toBeEnabled());
    });

    it("becomes valid once every field is filled for a brand-new (non-prefilled) MQG create-branch run", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();

      expect(buildButton()).toBeDisabled();

      await user.type(screen.getByLabelText("Execution Name"), "New run");
      await user.click(screen.getByLabelText("Unofficial Execution"));

      // The configuration parameters are owned by the child sub-form (covered by
      // its own spec); here they are supplied straight to the shared controls.
      const controls = fixture.componentInstance.form().controls;
      controls.repositoryId.setValue("repo-1");
      controls.businessProcessQualityLevel.setValue("MQG");
      controls.createBranch.setValue(true);
      controls.archivalBranchName.setValue("arch-1");
      controls.parentBranchName.setValue("main");
      controls.finalProductId.setValue("fp-1");
      controls.configCommitId.setValue("cfg-1");
      controls.rtpCommitId.setValue("rtp-1");
      controls.qualityGateScenarioDefinitionIds.setValue(["scenario-1"]);
      controls.qualityGateInfraGroupId.setValue("infra-1");

      await user.click(document.getElementById("validation-nightly-yes")!);

      await waitFor(() => expect(buildButton()).toBeEnabled());
    });

    it("shows an error toast and does not emit created when the execute call fails", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        providedInputs: FULLY_PREFILLED_INPUTS,
      });
      const created = jest.fn();
      fixture.componentInstance.created.subscribe(created);
      mockExecutorService.executeValidationProcessDefinition.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My validation run"
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
