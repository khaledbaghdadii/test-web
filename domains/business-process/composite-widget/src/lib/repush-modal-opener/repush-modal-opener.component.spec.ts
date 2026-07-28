import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { of, throwError } from "rxjs";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { MockComponent, ngMocks } from "ng-mocks";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import {
  BusinessProcessExecutionEligibilityService,
  EligibilityResponse,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import { BusinessProcessLimitExceedModalComponent } from "./business-process-limit-exceed-modal.component";
import {
  RepushEligibleEvent,
  RepushModalOpenerComponent,
} from "./repush-modal-opener.component";

const MOCK_IMPORTS = [
  Button,
  Tooltip,
  MockComponent(BusinessProcessLimitExceedModalComponent),
];

const mockEligibilityService = {
  getBusinessProcessExecutionEligibility: jest.fn(),
};

const mockToastService = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
};

const mockAnalyticsTracker = {
  trackEvent: jest.fn(),
};

const REQUIRED_INPUTS = {
  projectId: "project-123",
  processId: "process-456",
  familyId: ExecutionFamily.UPGRADE_PROCESS,
  familyName: "Binary Upgrade",
  sourceDefinitionId: "source-def-1" as string | null,
  disabled: false,
};

async function renderComponent(inputs: Partial<typeof REQUIRED_INPUTS> = {}) {
  return render(RepushModalOpenerComponent, {
    inputs: { ...REQUIRED_INPUTS, ...inputs },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      {
        provide: BusinessProcessExecutionEligibilityService,
        useValue: mockEligibilityService,
      },
      { provide: AnalyticsTrackerService, useValue: mockAnalyticsTracker },
    ],
    providers: [{ provide: ToastMessageService, useValue: mockToastService }],
  });
}

function repushButton(): HTMLElement {
  return screen.getByRole("button");
}

describe("RepushModalOpenerComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEligibilityService.getBusinessProcessExecutionEligibility.mockReturnValue(
      of<EligibilityResponse>({ eligible: true })
    );
  });

  describe("button disabled state", () => {
    it("is enabled for a valid source definition", async () => {
      await renderComponent();

      expect(repushButton()).toBeEnabled();
    });

    it("is disabled when the disabled input is true", async () => {
      await renderComponent({ disabled: true });

      expect(repushButton()).toBeDisabled();
    });

    it("is disabled when the source definition is on-demand backport", async () => {
      await renderComponent({ sourceDefinitionId: "on-demand-backport" });

      expect(repushButton()).toBeDisabled();
    });

    it("is disabled when the source definition is null", async () => {
      await renderComponent({ sourceDefinitionId: null });

      expect(repushButton()).toBeDisabled();
    });
  });

  describe("tooltip", () => {
    it("shows a repush tooltip when enabled", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.hover(repushButton());

      expect(await screen.findByText("Repush")).toBeTruthy();
    });
  });

  describe("button appearance", () => {
    it("uses the shared refresh icon", async () => {
      await renderComponent();

      expect(document.querySelector("mxevolve-icon")).toBeTruthy();
    });
  });

  describe("opening the repush flow", () => {
    it("does not request eligibility when the button is disabled", async () => {
      const user = userEvent.setup();
      await renderComponent({ sourceDefinitionId: null });

      await user.click(repushButton());

      expect(
        mockEligibilityService.getBusinessProcessExecutionEligibility
      ).not.toHaveBeenCalled();
    });

    it("requests eligibility for the source definition when clicked", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(repushButton());

      expect(
        mockEligibilityService.getBusinessProcessExecutionEligibility
      ).toHaveBeenCalledWith(
        REQUIRED_INPUTS.projectId,
        REQUIRED_INPUTS.familyId,
        REQUIRED_INPUTS.sourceDefinitionId
      );
    });

    it("tracks the repush button click", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(repushButton());

      expect(mockAnalyticsTracker.trackEvent).toHaveBeenCalledWith(
        EventCategory.BUTTON,
        EventAction.CLICK_BUTTON,
        `Open Repush Modal - ${ExecutionFamily.UPGRADE_PROCESS}`
      );
    });

    it("emits eligibleToRepush when the user is eligible", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitted: RepushEligibleEvent[] = [];
      fixture.componentInstance.eligibleToRepush.subscribe((event) =>
        emitted.push(event)
      );

      await user.click(repushButton());

      expect(emitted).toEqual([
        {
          projectId: REQUIRED_INPUTS.projectId,
          processId: REQUIRED_INPUTS.processId,
          familyId: REQUIRED_INPUTS.familyId,
        },
      ]);
    });

    it("re-enables the button after an eligible response", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(repushButton());

      await waitFor(() => expect(repushButton()).toBeEnabled());
    });

    it("shows the limit exceeded modal when the user is not eligible", async () => {
      const ineligibilityResult = {
        reason: "LOAD_LIMIT_EXCEEDED",
        ineligibilityData: {
          type: "default-binary-upgrade-limit-group",
          currentRunning: 5,
          maximumSupported: 5,
        },
      };
      mockEligibilityService.getBusinessProcessExecutionEligibility.mockReturnValue(
        of<EligibilityResponse>({ eligible: false, ineligibilityResult })
      );

      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitted: RepushEligibleEvent[] = [];
      fixture.componentInstance.eligibleToRepush.subscribe((event) =>
        emitted.push(event)
      );

      await user.click(repushButton());

      await waitFor(() => {
        const modal = ngMocks.find(
          fixture,
          BusinessProcessLimitExceedModalComponent
        ).componentInstance;
        expect(modal.visible).toBe(true);
        expect(modal.ineligibilityResult).toEqual(ineligibilityResult);
      });
      expect(emitted).toEqual([]);
    });

    it("shows an error toast when the eligibility request fails", async () => {
      mockEligibilityService.getBusinessProcessExecutionEligibility.mockReturnValue(
        throwError(() => new Error("boom"))
      );

      const user = userEvent.setup();
      await renderComponent();

      await user.click(repushButton());

      expect(mockToastService.showError).toHaveBeenCalledWith("boom");
      expect(repushButton()).toBeEnabled();
    });
  });
});
