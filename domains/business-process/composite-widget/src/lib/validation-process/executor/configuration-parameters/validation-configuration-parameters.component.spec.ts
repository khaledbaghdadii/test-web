import { render, screen, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { Select } from "primeng/select";
import { RepositorySelectorComponent } from "@mxevolve/domains/scm/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ProvidedDefinitionInput } from "@mxevolve/domains/business-process/util";
import { ValidationConfigurationParametersComponent } from "./validation-configuration-parameters.component";
import { ValidationMqgParametersComponent } from "./mqg-parameters/validation-mqg-parameters.component";
import { ValidationDqgParametersComponent } from "./dqg-parameters/validation-dqg-parameters.component";

const MOCK_IMPORTS = [
  ReactiveFormsModule,
  Select,
  DefinitionInputComponent,
  MockComponent(RepositorySelectorComponent),
  MockComponent(ValidationMqgParametersComponent),
  MockComponent(ValidationDqgParametersComponent),
];

const mockToast = { showError: jest.fn() };

interface RenderOptions {
  providedInputs?: readonly ProvidedDefinitionInput[];
  repositoryId?: string | null;
  businessProcessQualityLevel?: string | null;
}

async function renderComponent({
  providedInputs = [],
  repositoryId = "repo-1",
  businessProcessQualityLevel = null,
}: RenderOptions = {}) {
  const controls = {
    repositoryId: new FormControl<string | null>(repositoryId, [
      Validators.required,
    ]),
    businessProcessQualityLevel: new FormControl<string | null>(
      businessProcessQualityLevel,
      [Validators.required]
    ),
    createBranch: new FormControl<boolean | null>(null),
    parentBranchName: new FormControl<string | null>(null),
    archivalBranchName: new FormControl<string | null>(null),
    finalProductId: new FormControl<string | null>(null),
    configCommitId: new FormControl<string | null>(null),
    rtpCommitId: new FormControl<string | null>(null),
  };

  const view = await render(ValidationConfigurationParametersComponent, {
    inputs: {
      projectId: "project-1",
      providedInputs,
      repositoryIdFormControl: controls.repositoryId,
      businessProcessQualityLevelFormControl:
        controls.businessProcessQualityLevel,
      createBranchFormControl: controls.createBranch,
      parentBranchNameFormControl: controls.parentBranchName,
      archivalBranchNameFormControl: controls.archivalBranchName,
      finalProductIdFormControl: controls.finalProductId,
      configCommitIdFormControl: controls.configCommitId,
      rtpCommitIdFormControl: controls.rtpCommitId,
    },
    componentImports: MOCK_IMPORTS,
    providers: [{ provide: ToastMessageService, useValue: mockToast }],
  });

  return { ...view, controls };
}

function repositorySelector() {
  return ngMocks.find(RepositorySelectorComponent).componentInstance;
}

describe("ValidationConfigurationParametersComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("quality level availability", () => {
    it("offers the quality level once a repository is chosen", async () => {
      const { controls } = await renderComponent({ repositoryId: "repo-1" });

      expect(controls.businessProcessQualityLevel.enabled).toBe(true);
      expect(
        screen.getByText("Business Process Quality Level")
      ).toBeInTheDocument();
    });

    it("locks the quality level away until a repository is chosen", async () => {
      const { controls } = await renderComponent({ repositoryId: null });

      expect(controls.businessProcessQualityLevel.disabled).toBe(true);
      expect(
        screen.queryByText("Business Process Quality Level")
      ).toBeNull();
    });

    /**
     * Legacy cleared the quality level only through `repositoryValueNotSet$` -
     * i.e. when the repository became *empty*.
     */
    it("clears the quality level when the repository is emptied", async () => {
      const { controls } = await renderComponent({
        businessProcessQualityLevel: "MQG",
      });

      controls.repositoryId.setValue(null);

      await waitFor(() =>
        expect(controls.businessProcessQualityLevel.value).toBeNull()
      );
    });

    /**
     * The clear has to emit: `businessProcessQualityLevel` feeds the executor's
     * scope-visibility snapshot, which is recomputed only from `valueChanges`.
     * A silent write strands the snapshot on the old quality level.
     */
    it("announces the cleared quality level so the executor's snapshot follows", async () => {
      const { controls } = await renderComponent({
        businessProcessQualityLevel: "MQG",
      });
      const seen: (string | null)[] = [];
      controls.businessProcessQualityLevel.valueChanges.subscribe((value) =>
        seen.push(value)
      );

      controls.repositoryId.setValue(null);

      await waitFor(() => expect(seen).toContain(null));
    });

    /**
     * Legacy validation never bound `repositoryChanged` at all: a
     * definition-prefilled quality level survived the user re-picking a
     * repository. Wiping it on every change made the prefilled value
     * unrecoverable without reopening the dialog.
     */
    it("keeps a chosen quality level when the user switches to another repository", async () => {
      const { controls } = await renderComponent({
        businessProcessQualityLevel: "MQG",
      });

      repositorySelector().repositoryChanged.emit();
      controls.repositoryId.setValue("repo-2");

      await waitFor(() =>
        expect(controls.businessProcessQualityLevel.value).toBe("MQG")
      );
    });
  });

  describe("quality-level sub-form", () => {
    it("shows the MQG parameters for an MQG run", async () => {
      await renderComponent({ businessProcessQualityLevel: "MQG" });

      expect(
        document.querySelector("mxevolve-validation-mqg-parameters")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-validation-dqg-parameters")
      ).toBeNull();
    });

    it("shows the DQG parameters for a DQG run", async () => {
      await renderComponent({ businessProcessQualityLevel: "DQG" });

      expect(
        document.querySelector("mxevolve-validation-dqg-parameters")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-validation-mqg-parameters")
      ).toBeNull();
    });
  });

  it("surfaces a repository lookup failure to the user", async () => {
    await renderComponent();

    repositorySelector().failureEvent.emit("Repositories are unavailable");

    expect(mockToast.showError).toHaveBeenCalledWith(
      "Repositories are unavailable"
    );
  });
});
