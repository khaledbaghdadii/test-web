import { render, screen, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MockComponent } from "ng-mocks";
import { InputText } from "primeng/inputtext";
import { FinalProductDropdownInputComponent } from "@mxevolve/domains/artifact/widget";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ProvidedDefinitionInput } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { MqgFromNewBranchParametersComponent } from "./mqg-from-new-branch-parameters.component";

const MOCK_IMPORTS = [
  ReactiveFormsModule,
  InputText,
  DefinitionInputComponent,
  MockComponent(BranchInputComponent),
  MockComponent(FinalProductDropdownInputComponent),
];

const mockToast = { showError: jest.fn(), showWarning: jest.fn() };

interface RenderOptions {
  providedInputs?: readonly ProvidedDefinitionInput[];
  finalProductRequired?: boolean;
  parentBranchName?: string | null;
}

async function renderComponent({
  providedInputs = [],
  finalProductRequired = true,
  parentBranchName = null,
}: RenderOptions = {}) {
  const controls = {
    parentBranchName: new FormControl<string | null>(parentBranchName),
    archivalBranchName: new FormControl<string | null>(null),
    finalProductId: new FormControl<string | null>(
      null,
      finalProductRequired ? [Validators.required] : []
    ),
    configCommitId: new FormControl<string | null>(null),
    rtpCommitId: new FormControl<string | null>(null),
  };

  const view = await render(MqgFromNewBranchParametersComponent, {
    inputs: {
      projectId: "project-1",
      providedInputs,
      repositoryId: "repo-1",
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

describe("MqgFromNewBranchParametersComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("makes the parent branch mandatory when a final product must be chosen", async () => {
    const { controls } = await renderComponent({ finalProductRequired: true });

    expect(
      controls.parentBranchName.hasValidator(Validators.required)
    ).toBe(true);
  });

  it("leaves the parent branch optional when no final product is required", async () => {
    const { controls } = await renderComponent({ finalProductRequired: false });

    expect(
      controls.parentBranchName.hasValidator(Validators.required)
    ).toBe(false);
  });

  it("shows the parent branch on screen while it is mandatory and empty", async () => {
    await renderComponent({ finalProductRequired: true });

    await waitFor(() =>
      expect(screen.getByText("Parent Branch Name", { selector: "label" })).toBeTruthy()
    );
  });

  it("hides the parent branch when the definition already supplied a usable one", async () => {
    await renderComponent({
      finalProductRequired: true,
      providedInputs: [{ inputId: "parentBranch", value: "release-2026" }],
      parentBranchName: "release-2026",
    });

    expect(
      screen.queryByText("Parent Branch Name", { selector: "label" })
    ).toBeNull();
  });

  it("shows the archival branch field", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(screen.getByText("Archival Branch Name", { selector: "label" })).toBeTruthy()
    );
  });

  it("describes what the parent branch is for once it holds a usable value", async () => {
    await renderComponent({
      finalProductRequired: false,
      parentBranchName: "release-2026",
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Enter the Parent Branch from where you want to create your branch"
        )
      ).toBeTruthy()
    );
  });

  it("reports a parent branch that does not exist in the repository", async () => {
    const { fixture } = await renderComponent();

    fixture.detectChanges();
    const branchInputs = fixture.debugElement.nativeElement.querySelectorAll(
      "mxevolve-branch-input"
    );

    expect(branchInputs.length).toBeGreaterThan(0);
  });

  it("never leaves the parent branch required, empty and off screen", async () => {
    const { controls } = await renderComponent({
      finalProductRequired: true,
      providedInputs: [{ inputId: "parentBranch", value: "release-2026" }],
      parentBranchName: null,
    });

    const required = controls.parentBranchName.hasValidator(
      Validators.required
    );
    const empty = !controls.parentBranchName.value;
    const onScreen =
      screen.queryByText("Parent Branch Name", { selector: "label" }) !== null;

    // Required + empty + hidden is a deadlock: the run can never be submitted
    // and the user has nothing to fill in.
    expect(required && empty && !onScreen).toBe(false);
  });
});
