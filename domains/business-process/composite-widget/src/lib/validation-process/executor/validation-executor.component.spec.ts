import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { ReactiveFormsModule } from "@angular/forms";
import { MockComponent } from "ng-mocks";
import { Subject, of, throwError } from "rxjs";
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
} from "@mxevolve/domains/scm/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import {
  InfraGroupSelectorComponent,
  NotificationsRecipientsInputComponent,
  ValidationPrefilledInputsComponent,
} from "@mxevolve/domains/business-process/widget";
import { ScenarioDefinitionMultiselectDropdownComponent } from "@mxevolve/domains/test/widget";
import {
  ErrorAlertComponent,
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ScopeStartCommitInputComponent } from "../scope-start-commit-input/scope-start-commit-input.component";
import { ValidationConfigurationParametersComponent } from "./configuration-parameters/validation-configuration-parameters.component";
import {
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
} from "@mxevolve/domains/business-process/ui";
import { ValidationExecutorComponent } from "./validation-executor.component";

const COMPONENT_IMPORTS = [
  ReactiveFormsModule,
  ErrorAlertComponent,
  DefinitionInputComponent,
  DefinitionInputGroupComponent,
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
    ],
    providers: [
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
  });

  describe("required-field markers", () => {
    it("renders the mandatory-field legend", async () => {
      await renderComponent();

      expect(screen.getByText("* Mandatory Field")).toBeTruthy();
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

    /**
     * Legacy pinned a backend failure in a non-closeable alert at the top of the
     * dialog and cleared it on the next attempt. A toast is gone before the user
     * has finished reading the form that produced it, and the dialog is modal,
     * so there is nowhere else for the message to live.
     */
    it("anchors the failure in the dialog and does not emit created when the execute call fails", async () => {
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

      await waitFor(() => expect(screen.getByText("boom")).toBeVisible());
      expect(created).not.toHaveBeenCalled();
    });

    it("clears the pinned failure when the user resubmits", async () => {
      const user = userEvent.setup();
      await renderComponent({ providedInputs: FULLY_PREFILLED_INPUTS });
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
      await waitFor(() => expect(screen.getByText("boom")).toBeVisible());

      mockExecutorService.executeValidationProcessDefinition.mockReturnValue(
        new Subject()
      );
      await user.click(buildButton());

      await waitFor(() => expect(screen.queryByText("boom")).toBeNull());
    });

    /**
     * The branch inputs validate asynchronously. Without `form.pending` in the
     * guard, Enter submits while those checks are still in flight and the run is
     * created against a branch that may not exist.
     */
    it("refuses to submit while an async validator is still pending", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        providedInputs: FULLY_PREFILLED_INPUTS,
      });

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My validation run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));
      await waitFor(() => expect(buildButton()).toBeEnabled());

      fixture.componentInstance.form().controls.archivalBranchName.markAsPending();
      fixture.detectChanges();

      expect(buildButton()).toBeDisabled();
      fixture.componentInstance.build();
      expect(
        mockExecutorService.executeValidationProcessDefinition
      ).not.toHaveBeenCalled();
    });

    it("reports execution state to the host dialog so it can lock itself", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        providedInputs: FULLY_PREFILLED_INPUTS,
      });
      const busy: boolean[] = [];
      fixture.componentInstance.executingChange.subscribe((value) =>
        busy.push(value)
      );
      mockExecutorService.executeValidationProcessDefinition.mockReturnValue(
        new Subject()
      );

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My validation run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));
      await waitFor(() => expect(buildButton()).toBeEnabled());
      await user.click(buildButton());

      await waitFor(() => expect(busy.at(-1)).toBe(true));
    });
  });

  /**
   * Legacy gave every executor dialog a footer Cancel disabled during
   * execution. The repush path opens the executor directly (a stack of one, so
   * no back chevron), which is why Cancel has to exist as its own control.
   */
  describe("cancel", () => {
    it("emits cancelled when the footer Cancel is clicked", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const cancelled = jest.fn();
      fixture.componentInstance.cancelled.subscribe(cancelled);

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(cancelled).toHaveBeenCalledTimes(1);
    });

    it("disables Cancel while a run is being created", async () => {
      const user = userEvent.setup();
      await renderComponent({ providedInputs: FULLY_PREFILLED_INPUTS });
      mockExecutorService.executeValidationProcessDefinition.mockReturnValue(
        new Subject()
      );

      await user.type(
        screen.getByLabelText("Execution Name"),
        "My validation run"
      );
      await user.click(screen.getByLabelText("Unofficial Execution"));
      await waitFor(() => expect(buildButton()).toBeEnabled());
      await user.click(buildButton());

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
      );
    });
  });

  /**
   * The group's `[forceShow]` used to OR `notProvided('parentBranch')` in
   * unconditionally. `parentBranch` only exists on the MQG + "Create Branch =
   * Yes" path, so for every DQG - and every existing-branch - definition it was
   * permanently "not provided", and the whole Configuration Parameters group was
   * force-shown no matter how complete the template was. Legacy hid the group
   * whenever all of its controls were already valid.
   */
  describe("Configuration Parameters group visibility", () => {
    function configurationParametersHeading(): HTMLElement | null {
      return screen.queryByText("Configuration Parameters");
    }

    it("hides the group when a DQG definition supplies every configuration input", async () => {
      await renderComponent({
        providedInputs: [
          ...FULLY_PREFILLED_INPUTS.filter(
            (input) => input.inputId !== "businessProcessQualityLevel"
          ),
          { inputId: "businessProcessQualityLevel", value: "DQG" },
        ],
      });

      expect(configurationParametersHeading()).toBeNull();
    });

    it("hides the group when an MQG existing-branch definition supplies every configuration input", async () => {
      await renderComponent({ providedInputs: FULLY_PREFILLED_INPUTS });

      expect(configurationParametersHeading()).toBeNull();
    });

    it("shows the group when the definition leaves the repository out", async () => {
      await renderComponent({
        providedInputs: FULLY_PREFILLED_INPUTS.filter(
          (input) => input.inputId !== "repositoryId"
        ),
      });

      expect(configurationParametersHeading()).toBeInTheDocument();
    });

    /**
     * `parentBranch` still counts, but only for the path that actually renders
     * it: MQG with "Create Branch = Yes".
     */
    it("shows the group when an MQG create-branch definition leaves the parent branch out", async () => {
      await renderComponent({
        providedInputs: [
          ...FULLY_PREFILLED_INPUTS.filter(
            (input) => input.inputId !== "createBranch"
          ),
          { inputId: "createBranch", value: "true" },
        ],
      });

      expect(configurationParametersHeading()).toBeInTheDocument();
    });
  });

  /**
   * Legacy rendered nightly repush as a plain field with a label and a
   * description; the migration turned it into a group with a hardcoded
   * `<small>`, which reads as a section heading rather than a question.
   */
  describe("nightly repush presentation", () => {
    it("labels nightly repush as a field with its description", async () => {
      await renderComponent();

      const field = screen.getByText("Do you want to enable nightly repush?");
      expect(field.tagName).toBe("LABEL");
      expect(
        screen.getByText(
          "The timing is configured under BP settings accessible by admins"
        )
      ).toBeInTheDocument();
    });

    it("hides nightly repush when the definition already answered it", async () => {
      await renderComponent({ providedInputs: FULLY_PREFILLED_INPUTS });

      expect(
        screen.queryByText("Do you want to enable nightly repush?")
      ).toBeNull();
    });
  });
});
