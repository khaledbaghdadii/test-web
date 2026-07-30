import { render, screen, waitFor } from "@testing-library/angular";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MockComponent, ngMocks } from "ng-mocks";
import { Subject, of } from "rxjs";
import { InputText } from "primeng/inputtext";
import {
  LatestFinalProductFailureReason,
  LatestFinalProductFetcherService,
  LatestFinalProductResult,
} from "@mxevolve/domains/business-process/data-access";
import { BranchInputComponent } from "@mxevolve/domains/scm/widget";
import { DefinitionInputComponent } from "@mxevolve/domains/business-process/ui";
import {
  ToastMessageService,
  WarningAlertComponent,
} from "@mxevolve/shared/ui/primitive";
import type { FinalProduct } from "@mxevolve/domains/artifact/data-access";
import { FinalProductFromExistingBranchComponent } from "./final-product-from-existing-branch.component";

const LATEST_PRODUCT = {
  id: "fp-latest",
  configurationCommitId: "cfg-latest",
  rtpProduct: { rtpCommitId: "rtp-latest" },
} as FinalProduct;

const mockFetcher = { getLatestFinalProductOnBranch: jest.fn() };
const mockToast = { showError: jest.fn() };

const MOCK_IMPORTS = [
  ReactiveFormsModule,
  InputText,
  DefinitionInputComponent,
  WarningAlertComponent,
  MockComponent(BranchInputComponent),
];

interface RenderOptions {
  archivalBranchName?: string | null;
  preselectedFinalProductId?: string | null;
}

async function renderComponent({
  archivalBranchName = null,
  preselectedFinalProductId = null,
}: RenderOptions = {}) {
  const controls = {
    archivalBranchName: new FormControl<string | null>(archivalBranchName),
    // The already-chosen product lives in the form control itself - it is what a
    // definition prefill and a repush seed both land in.
    finalProductId: new FormControl<string | null>(preselectedFinalProductId),
    configCommitId: new FormControl<string | null>(null),
    rtpCommitId: new FormControl<string | null>(null),
  };

  const view = await render(FinalProductFromExistingBranchComponent, {
    inputs: {
      projectId: "project-1",
      providedInputs: [],
      repositoryId: "repo-1",
      archivalBranchNameFormControl: controls.archivalBranchName,
      finalProductIdFormControl: controls.finalProductId,
      configCommitIdFormControl: controls.configCommitId,
      rtpCommitIdFormControl: controls.rtpCommitId,
    },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: LatestFinalProductFetcherService, useValue: mockFetcher },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToast }],
  });

  return { ...view, controls };
}

function branchInput() {
  return ngMocks.find(BranchInputComponent);
}

describe("FinalProductFromExistingBranchComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetcher.getLatestFinalProductOnBranch.mockReturnValue(
      of<LatestFinalProductResult>({ finalProduct: LATEST_PRODUCT })
    );
  });

  describe("archival branch", () => {
    it("requires the archival branch to already exist", async () => {
      await renderComponent();

      expect(ngMocks.input(branchInput(), "branchShouldExist")).toBe(true);
    });

    it("labels the archival branch field", async () => {
      await renderComponent();

      expect(screen.getByText("Archival Branch Name")).toBeTruthy();
    });

    it("describes what the archival branch is for", async () => {
      await renderComponent();

      expect(
        screen.getByText(
          "Enter the name of the archival branch that you wish to use or create"
        )
      ).toBeTruthy();
    });

    it("warns that a prefilled archival branch does not exist when it is rejected", async () => {
      await renderComponent({ archivalBranchName: "missing-branch" });

      branchInput().componentInstance.initialInvalid.emit();

      expect(mockToast.showError).toHaveBeenCalledWith(
        "The branch name available in the Process Template doesn't exist in the repository. Please check the name and try again with an existing branch."
      );
    });
  });

  describe("final product lookup", () => {
    it("looks the final product up on the prefilled archival branch", async () => {
      await renderComponent({ archivalBranchName: "arch-1" });

      expect(mockFetcher.getLatestFinalProductOnBranch).toHaveBeenCalledWith({
        projectId: "project-1",
        repositoryId: "repo-1",
        branchName: "arch-1",
      });
    });

    it("shows the found final product's configuration commit read-only", async () => {
      await renderComponent({ archivalBranchName: "arch-1" });

      await waitFor(() =>
        expect(
          screen.getByLabelText("Final Product (represented by a Commit ID)")
        ).toHaveValue("cfg-latest")
      );
    });

    it("shows the found final product's RTP commit read-only", async () => {
      await renderComponent({ archivalBranchName: "arch-1" });

      await waitFor(() =>
        expect(screen.getByLabelText("RTP Commit ID")).toHaveValue("rtp-latest")
      );
    });

    it("falls back to the configuration commit when the final product has no RTP product", async () => {
      mockFetcher.getLatestFinalProductOnBranch.mockReturnValue(
        of<LatestFinalProductResult>({
          finalProduct: {
            id: "fp-1",
            configurationCommitId: "cfg-only",
          } as FinalProduct,
        })
      );
      await renderComponent({ archivalBranchName: "arch-1" });

      await waitFor(() =>
        expect(screen.getByLabelText("RTP Commit ID")).toHaveValue("cfg-only")
      );
    });

    it("records the found final product for submission", async () => {
      const { controls } = await renderComponent({
        archivalBranchName: "arch-1",
      });

      await waitFor(() =>
        expect(controls.finalProductId.value).toBe("fp-latest")
      );
    });

    it("shows a spinner while the final product is being looked up", async () => {
      const pending = new Subject<LatestFinalProductResult>();
      mockFetcher.getLatestFinalProductOnBranch.mockReturnValue(pending);
      await renderComponent({ archivalBranchName: "arch-1" });

      expect(
        screen.getAllByRole("status", { name: "Loading" }).length
      ).toBeGreaterThan(0);
    });

    it("hides the spinner once the final product is found", async () => {
      await renderComponent({ archivalBranchName: "arch-1" });

      await waitFor(() =>
        expect(
          screen.queryAllByRole("status", { name: "Loading" })
        ).toHaveLength(0)
      );
    });

    it("does not look anything up before an archival branch is chosen", async () => {
      await renderComponent();

      expect(mockFetcher.getLatestFinalProductOnBranch).not.toHaveBeenCalled();
    });

    it("clears the final product when the archival branch is emptied", async () => {
      const { controls, fixture } = await renderComponent({
        archivalBranchName: "arch-1",
      });
      await waitFor(() =>
        expect(controls.finalProductId.value).toBe("fp-latest")
      );

      controls.archivalBranchName.setValue("");
      fixture.detectChanges();

      expect(controls.finalProductId.value).toBeNull();
      expect(controls.configCommitId.value).toBeNull();
      expect(controls.rtpCommitId.value).toBeNull();
    });
  });

  describe("warnings", () => {
    async function renderWithFailure(
      failureReason: LatestFinalProductFailureReason
    ) {
      mockFetcher.getLatestFinalProductOnBranch.mockReturnValue(
        of<LatestFinalProductResult>({ failureReason })
      );
      return renderComponent({ archivalBranchName: "arch-1" });
    }

    it("warns when the archival branch cannot be validated", async () => {
      await renderWithFailure(
        LatestFinalProductFailureReason.INVALID_BRANCH_NAME
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            "Could not validate the selected archival branch. Please ensure the branch is valid and exists."
          )
        ).toBeTruthy()
      );
    });

    it("warns when the archival branch carries no final product", async () => {
      await renderWithFailure(
        LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            "Could not find a final product on the selected archival branch."
          )
        ).toBeTruthy()
      );
    });

    it("warns when the lookup fails unexpectedly", async () => {
      await renderWithFailure(
        LatestFinalProductFailureReason.UNEXPECTED_FAILURE
      );

      await waitFor(() =>
        expect(
          screen.getByText(
            "Something went wrong while fetching the latest final product on the archival branch."
          )
        ).toBeTruthy()
      );
    });

    it("hides the read-only final product fields when the lookup fails", async () => {
      await renderWithFailure(
        LatestFinalProductFailureReason.NO_FINAL_PRODUCT_FOUND
      );

      await waitFor(() =>
        expect(
          screen.queryByLabelText("Final Product (represented by a Commit ID)")
        ).toBeNull()
      );
    });

    /**
     * The comparison is against the live control rather than the repush seed:
     * a definition-prefilled product sits in that control too, so comparing
     * against the seed meant this warning could never fire for one.
     */
    it("warns when the already-chosen final product is not the latest on the branch", async () => {
      const { controls } = await renderComponent({
        archivalBranchName: "arch-1",
        preselectedFinalProductId: "fp-older",
      });

      await waitFor(() =>
        expect(
          screen.getByText(
            /the process will tag and promote the latest final product on the branch/
          )
        ).toBeTruthy()
      );
      // Legacy kept the chosen product and only warned; it never swapped it.
      expect(controls.finalProductId.value).toBe("fp-older");
    });

    it("adopts the branch's product when nothing was chosen yet", async () => {
      const { controls } = await renderComponent({
        archivalBranchName: "arch-1",
      });

      await waitFor(() =>
        expect(controls.finalProductId.value).toBe("fp-latest")
      );
      expect(document.querySelector("mxevolve-warning-alert")).toBeNull();
    });

    /**
     * Legacy wrote the branch's product only when nothing had been chosen, so a
     * choice that already matches is left exactly as the definition (or the
     * repush) supplied it - commits included.
     */
    it("stays silent and writes nothing when the already-chosen product is the latest", async () => {
      const { controls } = await renderComponent({
        archivalBranchName: "arch-1",
        preselectedFinalProductId: "fp-latest",
      });

      await waitFor(() =>
        expect(screen.getByLabelText("RTP Commit ID")).toBeInTheDocument()
      );
      expect(controls.finalProductId.value).toBe("fp-latest");
      expect(controls.rtpCommitId.value).toBeNull();
      expect(document.querySelector("mxevolve-warning-alert")).toBeNull();
    });
  });

  describe("teardown", () => {
    it("clears the archival branch and final product when the user switches away from an existing branch", async () => {
      const { fixture, controls } = await renderComponent({
        archivalBranchName: "arch-1",
      });
      await waitFor(() =>
        expect(controls.finalProductId.value).toBe("fp-latest")
      );

      fixture.destroy();

      expect(controls.archivalBranchName.value).toBeNull();
      expect(controls.finalProductId.value).toBeNull();
      expect(controls.configCommitId.value).toBeNull();
      expect(controls.rtpCommitId.value).toBeNull();
    });

    it("disables the archival branch when the user switches away from an existing branch", async () => {
      const { fixture, controls } = await renderComponent({
        archivalBranchName: "arch-1",
      });

      fixture.destroy();

      expect(controls.archivalBranchName.disabled).toBe(true);
    });
  });
});
