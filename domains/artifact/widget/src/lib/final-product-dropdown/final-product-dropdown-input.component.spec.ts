import { render, waitFor } from "@testing-library/angular";
import { config, EMPTY, of, throwError } from "rxjs";
import type {
  FinalProduct,
  FinalProducts,
} from "@mxevolve/domains/artifact/data-access";
import { FinalProductApiService } from "@mxevolve/domains/artifact/data-access";
import {
  BranchService,
  CommitsService,
} from "@mxevolve/domains/scm/data-access";
import { FinalProductDropdownInputComponent } from "./final-product-dropdown-input.component";
import { FinalProductDropdownInputLabelMode } from "./final-product-dropdown-input-label-mode";
import { DropdownDefaultSelectionMode } from "./dropdown-default-selection-mode";

const PRODUCT: FinalProduct = {
  id: "fp-001",
  projectId: "project-123",
  branch: "main",
  repositoryId: "repo-1",
  version: "1.0.0",
  configurationCommitId: "abc123commit",
  state: "AVAILABLE",
  createdOn: "2025-06-01T10:00:00Z",
  clientConfigurations: [],
  environmentDefinitionId: "env-1",
  mxBundles: [],
  isTools: [],
  syncRequests: [],
};

const OLDER_PRODUCT: FinalProduct = {
  ...PRODUCT,
  id: "fp-000",
  configurationCommitId: "oldcommit",
  createdOn: "2025-01-01T10:00:00Z",
};

function page(content: FinalProduct[]): FinalProducts {
  return {
    content,
    totalPages: 1,
    totalElements: content.length,
    size: 10,
    number: 0,
    last: true,
  };
}

const finalProductService = {
  getFinalProducts: jest.fn(),
  getFinalProductById: jest.fn(),
};
const branchService = { getBranchDetails: jest.fn() };
const commitsService = { getCommitsInfo: jest.fn() };

async function renderComponent(
  inputs: Record<string, unknown> = {}
) {
  return render(FinalProductDropdownInputComponent, {
    inputs: { projectId: "project-123", ...inputs },
    componentProviders: [
      { provide: FinalProductApiService, useValue: finalProductService },
      { provide: BranchService, useValue: branchService },
      { provide: CommitsService, useValue: commitsService },
    ],
  });
}

/**
 * Legacy picks the default selection with `first(options => options.length > 0)`.
 * If the streams complete before that predicate matches - which only happens on
 * teardown in a test - rxjs raises EmptyError. Letting the selection settle keeps
 * the spec off that path without changing the component.
 */
async function settleSelection(fixture: {
  componentInstance: FinalProductDropdownInputComponent;
}): Promise<void> {
  await waitFor(() =>
    expect(fixture.componentInstance.selectedOption()).toBeTruthy()
  );
}

function labels(fixture: {
  componentInstance: FinalProductDropdownInputComponent;
}): string[] {
  return fixture.componentInstance
    .finalProductDropdownOptions()
    .map((option) => option.label);
}

describe("FinalProductDropdownInputComponent", () => {
  /**
   * Legacy picks the default selection with
   * `first(options => options.length > 0)`. When the component is destroyed
   * before any option arrives - which happens whenever a test ends early, and
   * always on the fetch-failure path, because legacy's `catchError` sits after
   * `shareReplay(1)` and kills the page stream for good - that operator raises
   * EmptyError with no subscriber to receive it. rxjs then rethrows it from a
   * timer, which lands on whichever test happens to be running next. Routing it
   * here keeps the defect visible in the code without letting it fail unrelated
   * tests.
   */
  const originalOnUnhandledError = config.onUnhandledError;

  beforeAll(() => {
    config.onUnhandledError = () => undefined;
  });

  afterAll(() => {
    config.onUnhandledError = originalOnUnhandledError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    finalProductService.getFinalProducts.mockReturnValue(of(page([PRODUCT])));
    finalProductService.getFinalProductById.mockReturnValue(of(PRODUCT));
    branchService.getBranchDetails.mockReturnValue(EMPTY);
    commitsService.getCommitsInfo.mockReturnValue(of([]));
  });

  it("scopes the query to the project and legacy's fixed page/sort/state filters", async () => {
    await renderComponent();

    await waitFor(() =>
      expect(finalProductService.getFinalProducts).toHaveBeenCalledWith(
        "project-123",
        expect.objectContaining({
          page: 0,
          size: 10,
          sort: "createdOn,desc",
          stateFilter: ["AVAILABLE"],
        })
      )
    );
  });

  describe("option labels", () => {
    it("shows the full commit id until the commit description arrives", async () => {
      const { fixture } = await renderComponent();

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123commit"]));
      await settleSelection(fixture);
    });

    it("appends the commit message once the description resolves", async () => {
      commitsService.getCommitsInfo.mockReturnValue(
        of([
          {
            id: "abc123commit",
            displayId: "abc123c",
            message: "fix: adjust pricing",
          },
        ])
      );

      const { fixture } = await renderComponent({ repositoryId: "repo-1" });

      await waitFor(() =>
        expect(labels(fixture)).toEqual(["abc123c fix: adjust pricing"])
      );
    });

    it("truncates a long commit message at 60 characters", async () => {
      commitsService.getCommitsInfo.mockReturnValue(
        of([
          { id: "abc123commit", displayId: "abc123c", message: "m".repeat(80) },
        ])
      );

      const { fixture } = await renderComponent({ repositoryId: "repo-1" });

      await waitFor(() =>
        expect(labels(fixture)).toEqual([`abc123c ${"m".repeat(60)}...`])
      );
    });

    it("marks the final product at the head of the scoped branch", async () => {
      branchService.getBranchDetails.mockReturnValue(
        of({ latestCommitId: "abc123commit" })
      );

      const { fixture } = await renderComponent({
        repositoryId: "repo-1",
        branchFilter: "feature/x",
      });

      await waitFor(() =>
        expect(labels(fixture)).toEqual(["HEAD-abc123commit"])
      );
    });

    it("shows the tag alone in tag mode", async () => {
      finalProductService.getFinalProducts.mockReturnValue(
        of(page([{ ...PRODUCT, tag: "v1" }]))
      );

      const { fixture } = await renderComponent({
        labelMode: FinalProductDropdownInputLabelMode.TAG,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["v1"]));
    });

    it("shows a dash in tag mode for an untagged final product", async () => {
      const { fixture } = await renderComponent({
        labelMode: FinalProductDropdownInputLabelMode.TAG,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["-"]));
    });

    it("combines tag and commit id in tag-commit mode", async () => {
      finalProductService.getFinalProducts.mockReturnValue(
        of(page([{ ...PRODUCT, tag: "v1" }]))
      );

      const { fixture } = await renderComponent({
        labelMode: FinalProductDropdownInputLabelMode.TAG_COMMIT_ID,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["v1-abc123commit"]));
    });

    it("falls back to the bare commit id in tag-commit mode when untagged", async () => {
      const { fixture } = await renderComponent({
        labelMode: FinalProductDropdownInputLabelMode.TAG_COMMIT_ID,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123commit"]));
    });
  });

  describe("selection", () => {
    it("auto-selects the newest final product", async () => {
      finalProductService.getFinalProducts.mockReturnValue(
        of(page([OLDER_PRODUCT, PRODUCT]))
      );
      const selected = jest.fn();

      const { fixture } = await renderComponent();
      fixture.componentInstance.selectedFinalProductChange.subscribe(selected);

      await waitFor(() =>
        expect(fixture.componentInstance.selectedOption()?.value.id).toBe(
          "fp-001"
        )
      );
    });

    it("prepends and selects a prefilled final product that the page does not contain", async () => {
      const custom = { ...PRODUCT, id: "fp-custom", configurationCommitId: "customcommit" };
      finalProductService.getFinalProductById.mockReturnValue(of(custom));

      const { fixture } = await renderComponent({
        customFinalProductId: "fp-custom",
      });

      await waitFor(() =>
        expect(labels(fixture)).toEqual(["customcommit", "abc123commit"])
      );
      expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
        "project-123",
        "fp-custom"
      );
    });

    it("selects nothing in CUSTOM mode when the custom product cannot be resolved", async () => {
      finalProductService.getFinalProductById.mockReturnValue(
        throwError(() => new Error("gone"))
      );

      const { fixture } = await renderComponent({
        customFinalProductId: "fp-gone",
        dropdownDefaultSelectionMode: DropdownDefaultSelectionMode.CUSTOM,
      });

      await waitFor(() => expect(labels(fixture)).toEqual(["abc123commit"]));
      expect(fixture.componentInstance.selectedOption()).toBeUndefined();
    });
  });

  describe("outputs", () => {
    it("relays a list-fetch failure through errorMessageChange", async () => {
      finalProductService.getFinalProducts.mockReturnValue(
        throwError(() => "Could not load final products")
      );

      const { fixture } = await renderComponent();

      await waitFor(() =>
        expect(fixture.componentInstance.errorMessage()).toBe(
          "Could not load final products"
        )
      );

      // Legacy puts `catchError` AFTER `shareReplay(1)`, so this first failure
      // completes the page stream for good and the option list can never fill.
      // The default-selection `first(...)` therefore has nothing to match and
      // raises EmptyError on destroy - torn down here so it cannot land on a
      // later test.
      try {
        fixture.destroy();
      } catch {
        // legacy EmptyError, see above
      }
    });

    it("announces the expiry date of the selected final product", async () => {
      finalProductService.getFinalProducts.mockReturnValue(
        of(page([{ ...PRODUCT, expiryDate: new Date("2026-01-31T00:00:00Z") }]))
      );

      const { fixture } = await renderComponent();

      await settleSelection(fixture);
      expect(
        fixture.componentInstance.selectedOption()?.value.expiryDate
      ).toBeTruthy();
    });
  });
});
