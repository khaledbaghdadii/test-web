import { render, screen, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { InputText } from "primeng/inputtext";
import {
  DropdownDefaultSelectionMode,
  FinalProductDropdownInputComponent,
  FinalProductDropdownInputLabelMode,
} from "@mxevolve/domains/artifact/widget";
import type { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import { ProvidedDefinitionInput } from "@mxevolve/domains/business-process/util";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { DqgFromNewBranchParametersComponent } from "./dqg-from-new-branch-parameters.component";

const MOCK_IMPORTS = [
  ReactiveFormsModule,
  InputText,
  DefinitionInputComponent,
  MockComponent(BranchInputComponent),
  MockComponent(FinalProductDropdownInputComponent),
];

const mockToast = { showError: jest.fn() };

const FINAL_PRODUCT = {
  id: "fp-1",
  configurationCommitId: "config-1",
  rtpProduct: { rtpCommitId: "rtp-1" },
} as FinalProduct;

const FINAL_PRODUCT_WITHOUT_RTP = {
  id: "fp-2",
  configurationCommitId: "config-2",
} as FinalProduct;

interface RenderOptions {
  providedInputs?: readonly ProvidedDefinitionInput[];
  archivalBranchName?: string | null;
  finalProductId?: string | null;
  rtpCommitId?: string | null;
}

async function renderComponent({
  providedInputs = [],
  archivalBranchName = null,
  finalProductId = null,
  rtpCommitId = null,
}: RenderOptions = {}) {
  const controls = {
    archivalBranchName: new FormControl<string | null>(archivalBranchName),
    finalProductId: new FormControl<string | null>(finalProductId),
    configCommitId: new FormControl<string | null>(null),
    rtpCommitId: new FormControl<string | null>(rtpCommitId),
  };

  const view = await render(DqgFromNewBranchParametersComponent, {
    inputs: {
      projectId: "project-1",
      providedInputs,
      repositoryId: "repo-1",
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

function dropdown() {
  return ngMocks.find(FinalProductDropdownInputComponent)
    .componentInstance as unknown as {
    projectId: string;
    repositoryId: string;
    validationLevel: string[];
    fetchParent: boolean;
    dropdownDefaultSelectionMode: DropdownDefaultSelectionMode;
    customFinalProductId: string;
    selectedFinalProductChange: { emit: (value?: FinalProduct) => void };
  };
}

describe("DqgFromNewBranchParametersComponent", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("archival branch", () => {
    it("asks for the archival branch to create", async () => {
      await renderComponent();

      expect(screen.getByText("Archival Branch Name")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Enter the name of the archival branch that you wish to use or create"
        )
      ).toBeInTheDocument();
    });

    it("requires the archival branch not to exist yet, since it is being created", async () => {
      await renderComponent();

      expect(
        ngMocks.input(ngMocks.find(BranchInputComponent), "branchShouldExist")
      ).toBe(false);
    });

    it("hands the branch input the repository and the branch it started with", async () => {
      await renderComponent({ archivalBranchName: "arch-1" });

      const branchInput = ngMocks.find(BranchInputComponent);
      expect(ngMocks.input(branchInput, "projectId")).toBe("project-1");
      expect(ngMocks.input(branchInput, "repositoryId")).toBe("repo-1");
      expect(ngMocks.input(branchInput, "initialValue")).toBe("arch-1");
    });

    it("makes the archival branch editable", async () => {
      const { controls } = await renderComponent();

      expect(controls.archivalBranchName.enabled).toBe(true);
    });

    it("explains that a prefilled archival branch already exists", async () => {
      await renderComponent({ archivalBranchName: "arch-1" });

      ngMocks.find(BranchInputComponent).componentInstance.initialInvalid.emit();

      expect(mockToast.showError).toHaveBeenCalledWith(
        "The branch name available in the Process Template already exists in the repository. Please update the Process Template with a unique name to create a new branch."
      );
    });
  });

  describe("final product", () => {
    it("lists MQG products by tag, unscoped to a branch", async () => {
      await renderComponent();

      expect(dropdown().validationLevel).toEqual(["MQG"]);
      expect(
        ngMocks.input(
          ngMocks.find(FinalProductDropdownInputComponent),
          "labelMode"
        )
      ).toBe(FinalProductDropdownInputLabelMode.TAG_COMMIT_ID);
      expect(dropdown().fetchParent).toBe(false);
    });

    it("offers the final product for editing", async () => {
      const { controls } = await renderComponent();

      expect(
        screen.getByText("Final Product (represented by Tag-Commit ID)")
      ).toBeInTheDocument();
      expect(controls.finalProductId.enabled).toBe(true);
    });

    /**
     * Without an explicit mode the dropdown state service defaults to LATEST,
     * which re-sorts by createdOn and auto-selects the newest product - silently
     * replacing the one the Process Template prefilled. Legacy always passed
     * CUSTOM.
     */
    it("does not let the dropdown auto-select the newest product", async () => {
      await renderComponent({ finalProductId: "fp-prefilled" });

      expect(dropdown().dropdownDefaultSelectionMode).toBe(
        DropdownDefaultSelectionMode.CUSTOM
      );
    });

    it("hands the dropdown the product the form arrived with", async () => {
      await renderComponent({ finalProductId: "fp-prefilled" });

      expect(dropdown().customFinalProductId).toBe("fp-prefilled");
    });

    it("carries the commits along when a product is chosen", async () => {
      const { controls } = await renderComponent();

      dropdown().selectedFinalProductChange.emit(FINAL_PRODUCT);

      expect(controls.finalProductId.value).toBe("fp-1");
      expect(controls.configCommitId.value).toBe("config-1");
      expect(controls.rtpCommitId.value).toBe("rtp-1");
    });

    it("falls back to the configuration commit when the product has no RTP commit", async () => {
      const { controls } = await renderComponent();

      dropdown().selectedFinalProductChange.emit(FINAL_PRODUCT_WITHOUT_RTP);

      expect(controls.rtpCommitId.value).toBe("config-2");
    });

    it("drops the product and both commits when the selection is cleared", async () => {
      const { controls } = await renderComponent();
      dropdown().selectedFinalProductChange.emit(FINAL_PRODUCT);

      dropdown().selectedFinalProductChange.emit(undefined);

      expect(controls.finalProductId.value).toBeNull();
      expect(controls.configCommitId.value).toBeNull();
      expect(controls.rtpCommitId.value).toBeNull();
    });
  });

  describe("RTP commit", () => {
    it("stays hidden until a product supplies one", async () => {
      await renderComponent();

      expect(screen.queryByText("RTP Commit ID")).toBeNull();
    });

    it("appears once a chosen product supplies one", async () => {
      const { detectChanges } = await renderComponent();

      dropdown().selectedFinalProductChange.emit(FINAL_PRODUCT);
      detectChanges();

      await waitFor(() =>
        expect(screen.getByText("RTP Commit ID")).toBeInTheDocument()
      );
    });

    it("is read-only, because it follows the chosen product", async () => {
      const { detectChanges } = await renderComponent({ rtpCommitId: "rtp-1" });
      detectChanges();

      expect(screen.getByLabelText("RTP Commit ID")).toHaveAttribute(
        "readonly"
      );
    });
  });

  describe("definition-provided inputs", () => {
    it("hides the archival branch the definition already supplied", async () => {
      await renderComponent({
        providedInputs: [
          { inputId: "archivalBranchName", value: "arch-from-template" },
        ],
        archivalBranchName: "arch-from-template",
      });

      expect(screen.queryByText("Archival Branch Name")).toBeNull();
    });

    it("still shows an input the definition left empty", async () => {
      await renderComponent({
        providedInputs: [{ inputId: "archivalBranchName", value: "" }],
      });

      expect(screen.getByText("Archival Branch Name")).toBeInTheDocument();
    });
  });

  describe("teardown", () => {
    /**
     * The step hands its controls back when it is unmounted, so the next
     * quality-level sub-form does not inherit a branch or product chosen for a
     * different path.
     */
    it("clears and releases the archival branch and the final product", async () => {
      const { fixture, controls } = await renderComponent({
        archivalBranchName: "arch-1",
        finalProductId: "fp-1",
      });

      fixture.destroy();

      expect(controls.archivalBranchName.value).toBeNull();
      expect(controls.archivalBranchName.disabled).toBe(true);
      expect(controls.finalProductId.value).toBeNull();
      expect(controls.finalProductId.disabled).toBe(true);
      expect(controls.configCommitId.value).toBeNull();
      expect(controls.rtpCommitId.value).toBeNull();
    });

    /**
     * `rtpCommitId` feeds the executor's scope-visibility snapshot, which is
     * recomputed only from `valueChanges`.
     */
    it("announces the cleared commits so the executor's snapshot follows", async () => {
      const { fixture, controls } = await renderComponent({
        rtpCommitId: "rtp-1",
      });
      const seen: (string | null)[] = [];
      controls.rtpCommitId.valueChanges.subscribe((value) => seen.push(value));

      fixture.destroy();

      expect(seen).toContain(null);
    });
  });
});
