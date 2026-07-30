import { render, screen, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MockComponent } from "ng-mocks";
import { RadioButton } from "primeng/radiobutton";
import { ProvidedDefinitionInput } from "@mxevolve/domains/business-process/util";
import { ValidationDqgParametersComponent } from "./validation-dqg-parameters.component";
import { DqgFromNewBranchParametersComponent } from "./from-new-branch/dqg-from-new-branch-parameters.component";
import { FinalProductFromExistingBranchComponent } from "../from-existing-branch/final-product-from-existing-branch.component";

const MOCK_IMPORTS = [
  ReactiveFormsModule,
  RadioButton,
  MockComponent(DqgFromNewBranchParametersComponent),
  MockComponent(FinalProductFromExistingBranchComponent),
];

interface RenderOptions {
  providedInputs?: readonly ProvidedDefinitionInput[];
  createBranch?: boolean | null;
}

async function renderComponent({
  providedInputs = [],
  createBranch = null,
}: RenderOptions = {}) {
  const controls = {
    createBranch: new FormControl<boolean | null>(createBranch, [
      Validators.required,
    ]),
    archivalBranchName: new FormControl<string | null>(null),
    finalProductId: new FormControl<string | null>(null),
    configCommitId: new FormControl<string | null>(null),
    rtpCommitId: new FormControl<string | null>(null),
  };

  const view = await render(ValidationDqgParametersComponent, {
    inputs: {
      projectId: "project-1",
      providedInputs,
      repositoryId: "repo-1",
      createBranchFormControl: controls.createBranch,
      archivalBranchNameFormControl: controls.archivalBranchName,
      finalProductIdFormControl: controls.finalProductId,
      configCommitIdFormControl: controls.configCommitId,
      rtpCommitIdFormControl: controls.rtpCommitId,
    },
    componentImports: MOCK_IMPORTS,
  });

  return { ...view, controls };
}

function createBranchQuestion(): HTMLElement | null {
  return screen.queryByText("Create Branch?");
}

describe("ValidationDqgParametersComponent", () => {
  /**
   * Same gate as the MQG twin: legacy wrapped the radio group in
   * `mxevolve-definition-input` with `ACCESS_INVALID_INPUTS_ONLY`, so a
   * definition that already answered "Create Branch?" did not ask again.
   */
  describe("Create Branch? visibility", () => {
    it("asks the question when the definition left it unanswered", async () => {
      await renderComponent();

      expect(createBranchQuestion()).toBeInTheDocument();
    });

    it("hides the question when the definition already answered it", async () => {
      await renderComponent({
        providedInputs: [{ inputId: "createBranch", value: true }],
        createBranch: true,
      });

      expect(createBranchQuestion()).toBeNull();
    });

    it("still asks when the definition supplied an unusable answer", async () => {
      await renderComponent({
        providedInputs: [{ inputId: "createBranch", value: "" }],
      });

      expect(createBranchQuestion()).toBeInTheDocument();
    });

    /**
     * The decision is taken once, like the wrapper does. Answering the question
     * makes the control valid, and re-evaluating would make the radios the user
     * just clicked disappear from under them.
     */
    it("keeps the question on screen once the user has answered it", async () => {
      const { controls, fixture } = await renderComponent();

      controls.createBranch.setValue(true);
      fixture.detectChanges();

      await waitFor(() => expect(createBranchQuestion()).toBeInTheDocument());
    });
  });

  describe("sub-form selection", () => {
    it("shows the new-branch parameters when the answer is Yes", async () => {
      await renderComponent({ createBranch: true });

      expect(
        document.querySelector("mxevolve-dqg-from-new-branch-parameters")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-final-product-from-existing-branch")
      ).toBeNull();
    });

    it("shows the existing-branch parameters when the answer is No", async () => {
      await renderComponent({ createBranch: false });

      expect(
        document.querySelector("mxevolve-final-product-from-existing-branch")
      ).toBeTruthy();
      expect(
        document.querySelector("mxevolve-dqg-from-new-branch-parameters")
      ).toBeNull();
    });

    it("shows neither sub-form until the question is answered", async () => {
      await renderComponent();

      expect(
        document.querySelector("mxevolve-dqg-from-new-branch-parameters")
      ).toBeNull();
      expect(
        document.querySelector("mxevolve-final-product-from-existing-branch")
      ).toBeNull();
    });
  });

  describe("teardown", () => {
    /**
     * The create-branch value feeds the executor's scope-visibility snapshot,
     * which is recomputed only from `valueChanges`. Releasing it silently left
     * the snapshot on a quality level the form had already left behind, which
     * could keep the Validation-Scope-Start-Commit field visible and required
     * with its preconditions gone.
     */
    it("announces the cleared create-branch answer when the step is torn down", async () => {
      const { controls, fixture } = await renderComponent({
        createBranch: true,
      });
      const seen: (boolean | null)[] = [];
      controls.createBranch.valueChanges.subscribe((value) =>
        seen.push(value as boolean | null)
      );

      fixture.destroy();

      expect(seen).toContain(null);
      expect(controls.createBranch.disabled).toBe(true);
    });
  });
});
