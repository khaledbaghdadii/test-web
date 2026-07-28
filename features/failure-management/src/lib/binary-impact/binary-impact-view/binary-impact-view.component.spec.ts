import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";
import { of, throwError } from "rxjs";

import { Store } from "@ngrx/store";
import { ActivatedRoute } from "@angular/router";
import { Project } from "@mxflow/core/global-store";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import {
  BinaryImpactDetailsComponent,
  EditBinaryImpactModalComponent,
} from "@mxflow/features/failure-management";
import { ProjectSpecificAnalysisObjectLinksTableComponent } from "@mxflow/features/failure-management-dashboard";
import { ButtonModule } from "primeng/button";
import { DividerModule } from "primeng/divider";

import { BinaryImpactViewComponent } from "./binary-impact-view.component";
import { UpgradeImpactSelectionModalComponent } from "../../upgrade-impact";
import { BinaryImpactService } from "../binary-impact.service";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/data-access";

const PROJECT_ID = "projectId";
const PROJECT_NAME = "projectName";
const BINARY_IMPACT_ID = "binaryImpactId";

const MOCK_IMPORTS = [
  CardContainerModule,
  HeaderTitleModule,
  ButtonModule,
  DividerModule,
  MockComponent(BinaryImpactDetailsComponent),
  MockComponent(ProjectSpecificAnalysisObjectLinksTableComponent),
  MockComponent(EditBinaryImpactModalComponent),
  MockComponent(UpgradeImpactSelectionModalComponent),
];

const mockStore = {
  select: jest.fn(),
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const mockBinaryImpactService = {
  updateUpgradeImpact: jest.fn(),
};

const mockTestManagementAnalyticsTrackerService = {
  trackEditUpgradeImpact: jest.fn(),
  trackSubmitSelectedUpgradeImpact: jest.fn(),
};

const activatedRoute = {
  params: of({ "binary-impact-id": BINARY_IMPACT_ID }),
};

function getProject(): Project {
  return {
    id: PROJECT_ID,
    name: PROJECT_NAME,
    description: "projectDescription",
    creationDate: "2021-01-01T00:00:00Z",
  };
}

async function renderComponent() {
  return render(BinaryImpactViewComponent, {
    componentImports: MOCK_IMPORTS,
    providers: [
      { provide: Store, useValue: mockStore },
      { provide: ActivatedRoute, useValue: activatedRoute },
      { provide: ToastMessageService, useValue: mockToastMessageService },
      {
        provide: TestManagementAnalyticsTrackerService,
        useValue: mockTestManagementAnalyticsTrackerService,
      },
    ],
    componentProviders: [
      { provide: BinaryImpactService, useValue: mockBinaryImpactService },
    ],
  });
}

function detailsComponent(): BinaryImpactDetailsComponent {
  return ngMocks.find(BinaryImpactDetailsComponent).componentInstance;
}

function editModal(): EditBinaryImpactModalComponent {
  return ngMocks.find(EditBinaryImpactModalComponent).componentInstance;
}

function upgradeImpactSelectionModal(): UpgradeImpactSelectionModalComponent {
  return ngMocks.find(UpgradeImpactSelectionModalComponent).componentInstance;
}

describe("BinaryImpactViewComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.select.mockReturnValue(of(getProject()));
    mockBinaryImpactService.updateUpgradeImpact.mockReturnValue(of(undefined));
  });

  it("renders the Edit button", async () => {
    await renderComponent();

    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
  });

  it("renders the Edit Upgrade Impact button", async () => {
    await renderComponent();

    expect(
      screen.getByRole("button", { name: "Edit Upgrade Impact" })
    ).toBeTruthy();
  });

  it("passes the selected project id to the binary impact details", async () => {
    await renderComponent();

    expect(detailsComponent().projectId).toEqual(PROJECT_ID);
  });

  it("passes the selected project name to the binary impact details", async () => {
    await renderComponent();

    expect(detailsComponent().projectName).toEqual(PROJECT_NAME);
  });

  it("passes the binary impact id from the route to the binary impact details", async () => {
    await renderComponent();

    expect(detailsComponent().binaryImpactId).toEqual(BINARY_IMPACT_ID);
  });

  it("shows an error toast when the binary impact details reports an error", async () => {
    await renderComponent();

    detailsComponent().errorMessageEmitter.emit("errorMessage");

    expect(mockToastMessageService.showError).toHaveBeenCalledWith(
      "errorMessage"
    );
  });

  describe("cleaning up on destroy", () => {
    it("emits on the destroy subject when the component is destroyed", async () => {
      const { fixture } = await renderComponent();
      const destroy$ = fixture.componentInstance["destroy$"];
      const nextSpy = jest.spyOn(destroy$, "next");

      fixture.destroy();

      expect(nextSpy).toHaveBeenCalled();
    });

    it("completes the destroy subject when the component is destroyed", async () => {
      const { fixture } = await renderComponent();
      const destroy$ = fixture.componentInstance["destroy$"];
      const completeSpy = jest.spyOn(destroy$, "complete");

      fixture.destroy();

      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe("editing the binary impact", () => {
    it("opens the edit modal when the user clicks Edit", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Edit" }));

      await waitFor(() => expect(editModal().isModalShown).toBeTruthy());
    });

    it("closes the edit modal when the modal requests to close", async () => {
      const user = userEvent.setup();
      await renderComponent();
      await user.click(screen.getByRole("button", { name: "Edit" }));

      editModal().closeModalEvent.emit();

      await waitFor(() => expect(editModal().isModalShown).toBeFalsy());
    });

    it("refreshes the binary impact details after an edit succeeds", async () => {
      await renderComponent();
      const refreshSpy = jest.spyOn(detailsComponent(), "ngOnInit");

      editModal().binaryImpactEdited.emit();

      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe("editing the upgrade impact", () => {
    it("opens the upgrade impact selection modal when the user clicks Edit Upgrade Impact", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Edit Upgrade Impact" })
      );

      await waitFor(() =>
        expect(upgradeImpactSelectionModal().isVisible).toBeTruthy()
      );
    });

    it("tracks the edit upgrade impact button click", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Edit Upgrade Impact" })
      );

      expect(
        mockTestManagementAnalyticsTrackerService.trackEditUpgradeImpact
      ).toHaveBeenCalled();
    });

    it("tracks the submit selected upgrade impact button click", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Edit Upgrade Impact" })
      );
      upgradeImpactSelectionModal().overrideBinaryImpactDescriptionChange.emit(
        false
      );
      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        "selectedUpgradeImpactId"
      );

      expect(
        mockTestManagementAnalyticsTrackerService.trackSubmitSelectedUpgradeImpact
      ).toHaveBeenCalled();
    });

    it("does not open the edit modal when an upgrade impact is selected", async () => {
      await renderComponent();

      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        "selectedUpgradeImpactId"
      );
      await waitFor(() => expect(editModal().isModalShown).toBeFalsy());
    });

    it("should update the upgrade impact when the user submit after selecting an upgrade impact", async () => {
      await renderComponent();
      upgradeImpactSelectionModal().overrideBinaryImpactDescriptionChange.emit(
        false
      );
      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        "selectedUpgradeImpactId"
      );

      await waitFor(() =>
        expect(
          mockBinaryImpactService.updateUpgradeImpact
        ).toHaveBeenCalledWith({
          projectId: PROJECT_ID,
          binaryImpactId: BINARY_IMPACT_ID,
          upgradeImpactId: "selectedUpgradeImpactId",
          overrideFromUpgradeImpact: false,
        })
      );
    });

    it("does not update the upgrade impact when the current selection is cleared", async () => {
      await renderComponent();
      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        "selectedUpgradeImpactId"
      );
      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        undefined
      );

      expect(
        mockBinaryImpactService.updateUpgradeImpact
      ).not.toHaveBeenCalled();
    });

    it("does not update the upgrade impact when the user opens the edit modal directly and submits", async () => {
      const user = userEvent.setup();
      await renderComponent();
      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        "selectedUpgradeImpactId"
      );
      await user.click(screen.getByRole("button", { name: "Edit" }));

      editModal().binaryImpactEdited.emit();

      expect(
        mockBinaryImpactService.updateUpgradeImpact
      ).not.toHaveBeenCalled();
    });

    async function selectUpgradeImpactWithOverride(override: boolean) {
      upgradeImpactSelectionModal().overrideBinaryImpactDescriptionChange.emit(
        override
      );
      upgradeImpactSelectionModal().selectedUpgradeImpactIdChange.emit(
        "selectedUpgradeImpactId"
      );
      await waitFor(() =>
        expect(mockBinaryImpactService.updateUpgradeImpact).toHaveBeenCalled()
      );
    }

    it("calls the update upgrade impact service with the correct request", async () => {
      await renderComponent();

      await selectUpgradeImpactWithOverride(true);

      expect(mockBinaryImpactService.updateUpgradeImpact).toHaveBeenCalledWith({
        projectId: PROJECT_ID,
        binaryImpactId: BINARY_IMPACT_ID,
        upgradeImpactId: "selectedUpgradeImpactId",
        overrideFromUpgradeImpact: true,
      });
    });

    it("refreshes the binary impact details after the update succeeds", async () => {
      await renderComponent();
      const refreshSpy = jest.spyOn(detailsComponent(), "ngOnInit");

      await selectUpgradeImpactWithOverride(true);

      expect(refreshSpy).toHaveBeenCalled();
    });

    it("shows an error toast when the update fails", async () => {
      mockBinaryImpactService.updateUpgradeImpact.mockReturnValue(
        throwError(() => new Error("errorMessage"))
      );
      await renderComponent();

      await selectUpgradeImpactWithOverride(true);

      expect(mockToastMessageService.showError).toHaveBeenCalledWith(
        "errorMessage"
      );
    });

    it("reopens the upgrade impact selection modal when the update fails", async () => {
      mockBinaryImpactService.updateUpgradeImpact.mockReturnValue(
        throwError(() => new Error("errorMessage"))
      );
      await renderComponent();

      await selectUpgradeImpactWithOverride(true);

      await waitFor(() =>
        expect(upgradeImpactSelectionModal().isVisible).toBeTruthy()
      );
    });
  });
});
