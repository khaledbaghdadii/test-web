import { render, screen, waitFor } from "@testing-library/angular";
import { of, throwError } from "rxjs";
import {
  FinalProductService,
  FinalProductState,
} from "@mxevolve/domains/artifact/data-access";
import { FinalProductDetailsComponent } from "./final-product-details.component";

describe("FinalProductDetailsComponent", () => {
  const finalProductService = {
    getFinalProductById: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    finalProductService.getFinalProductById.mockReturnValue(
      of({
        id: "final-product-1",
        branch: "MX-branch",
        configurationCommitId: "commit-1",
        validationLevel: "MQG",
        state: FinalProductState.AVAILABLE,
        factoryProduct: {
          id: "factory-product-1",
          type: "MX",
          softwareProduct: {
            id: "software-product-1",
            version: "3.1",
            revision: "1234",
          },
        },
      })
    );
  });

  it("fetches and displays final product details", async () => {
    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("final-product-1")).toBeInTheDocument();
    });

    expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
      "project-1",
      "final-product-1"
    );
    expect(screen.getByText("MX-branch")).toBeInTheDocument();
    expect(screen.getByText("commit-1")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("factory-product-1")).toBeInTheDocument();
  });

  it("uses dash placeholders when final product creation is still in progress", async () => {
    finalProductService.getFinalProductById.mockReturnValue(
      of({
        id: "final-product-1",
        state: FinalProductState.CREATING,
      })
    );

    await renderComponent();

    await waitFor(() => {
      expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("shows the legacy pre-publishing failure message and does not fetch", async () => {
    await render(FinalProductDetailsComponent, {
      inputs: {
        projectId: "project-1",
        finalProductFailure: "FAILURE_PRE_PUBLISHING_REQUESTED",
      },
      componentProviders: [
        { provide: FinalProductService, useValue: finalProductService },
      ],
    });

    expect(
      screen.getByText(
        "Something Went Wrong! Failed to request publishing a final product"
      )
    ).toBeInTheDocument();
    expect(finalProductService.getFinalProductById).not.toHaveBeenCalled();
  });

  it("shows publishing pending messages before the final product exists", async () => {
    await render(FinalProductDetailsComponent, {
      inputs: {
        projectId: "project-1",
        publishingStartDate: "2026-06-08T12:00:00Z",
      },
      componentProviders: [
        { provide: FinalProductService, useValue: finalProductService },
      ],
    });

    expect(screen.getByText("Publishing will be requested")).toBeInTheDocument();
    expect(finalProductService.getFinalProductById).not.toHaveBeenCalled();
  });

  it("emits fetch errors", async () => {
    const errorOccurred = jest.fn();
    finalProductService.getFinalProductById.mockReturnValue(
      throwError(() => new Error("Failed to load final product"))
    );

    await render(FinalProductDetailsComponent, {
      inputs: {
        projectId: "project-1",
        finalProductId: "final-product-1",
      },
      on: { errorOccurred },
      componentProviders: [
        { provide: FinalProductService, useValue: finalProductService },
      ],
    });

    await waitFor(() => {
      expect(errorOccurred).toHaveBeenCalledWith(
        "Failed to load final product"
      );
    });
  });

  function renderComponent() {
    return render(FinalProductDetailsComponent, {
      inputs: {
        projectId: "project-1",
        finalProductId: "final-product-1",
        publishingStartDate: "2026-06-08T12:00:00Z",
      },
      componentProviders: [
        { provide: FinalProductService, useValue: finalProductService },
      ],
    });
  }
});
