import { render, screen, waitFor } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";
import { MockComponent, ngMocks } from "ng-mocks";

import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { MessageModule } from "primeng/message";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { FormsModule } from "@angular/forms";

import { UpgradeImpactSelectionModalComponent } from "./upgrade-impact-selection-modal.component";
import { UpgradeImpactSelectionTableComponent } from "../upgrade-impact-selection-table/upgrade-impact-selection-table.component";
import { OverrideBinaryImpactDescriptionComponent } from "../../binary-impact/override-binary-impact-description/override-binary-impact-description.component";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { ToastMessageService } from "@mxflow/ui/alert";

const DIALOG_TITLE = "Upgrade Impacts in Validation Scope";
const SELECTED_UPGRADE_IMPACT_ID = "upgrade-impact-id";
const VALIDATION_SCOPE: ValidationScope = {
  currentVersion: "currentVersion",
  referenceVersion: "referenceVersion",
};

const mockToastMessageService = {
  showError: jest.fn(),
};

const MOCK_IMPORTS = [
  DialogModule,
  ButtonModule,
  MessageModule,
  ToggleSwitchModule,
  Tooltip,
  FormsModule,
  MockComponent(UpgradeImpactSelectionTableComponent),
  MockComponent(ValidationScopeSetterComponent),
  MockComponent(ShowDetectionWithNoDefectsToggleComponent),
  OverrideBinaryImpactDescriptionComponent,
];

interface ModalInputs {
  isVisible: boolean;
  hideSelection: boolean;
  selectedUpgradeImpactId?: string;
  showDescriptionOverrideOption: boolean;
}

async function renderComponent(inputs: Partial<ModalInputs> = {}) {
  return render(UpgradeImpactSelectionModalComponent, {
    inputs: {
      isVisible: true,
      ...inputs,
    },
    componentImports: MOCK_IMPORTS,
    componentProviders: [
      { provide: ToastMessageService, useValue: mockToastMessageService },
    ],
  });
}

describe("UpgradeImpactSelectionModalComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("shows the dialog title", async () => {
      await renderComponent();

      expect(screen.getByText(DIALOG_TITLE)).toBeTruthy();
    });

    it("shows the validation scope setter", async () => {
      const { fixture } = await renderComponent();
      expect(
        ngMocks.find(fixture, ValidationScopeSetterComponent).componentInstance
      ).toBeTruthy();
    });

    it("shows the upgrade impact selection table", async () => {
      const { fixture } = await renderComponent();

      expect(
        ngMocks.find(fixture, UpgradeImpactSelectionTableComponent)
          .componentInstance
      ).toBeTruthy();
    });
  });

  describe("submit button state", () => {
    it("disables the submit button when no upgrade impact is selected", async () => {
      await renderComponent();

      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Submit" })
          .disabled
      ).toBeTruthy();
    });

    it("enables the submit button when an upgrade impact is selected", async () => {
      const { fixture } = await renderComponent();

      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.selectedUpgradeImpactIdChange.emit(
          SELECTED_UPGRADE_IMPACT_ID
        );
      fixture.detectChanges();

      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Submit" })
          .disabled
      ).toBeFalsy();
    });

    it("disables the submit button when the description override is offered but no option is chosen", async () => {
      const { fixture } = await renderComponent({
        showDescriptionOverrideOption: true,
      });

      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.selectedUpgradeImpactIdChange.emit(
          SELECTED_UPGRADE_IMPACT_ID
        );
      fixture.detectChanges();

      expect(
        screen.getByRole<HTMLButtonElement>("button", { name: "Submit" })
          .disabled
      ).toBeTruthy();
    });

    it("enables the submit button when the description override is offered and an option is chosen", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent({
        showDescriptionOverrideOption: true,
      });

      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.selectedUpgradeImpactIdChange.emit(
          SELECTED_UPGRADE_IMPACT_ID
        );
      fixture.detectChanges();
      await user.click(
        screen.getByRole("radio", { name: "Keep Existing Description" })
      );

      await waitFor(() =>
        expect(
          screen.getByRole<HTMLButtonElement>("button", { name: "Submit" })
            .disabled
        ).toBeFalsy()
      );
    });
  });

  describe("submitting", () => {
    it("emits the selected upgrade impact", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const emitSpy = jest.spyOn(
        fixture.componentInstance.selectedUpgradeImpactIdChange,
        "emit"
      );
      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.selectedUpgradeImpactIdChange.emit(
          SELECTED_UPGRADE_IMPACT_ID
        );
      fixture.detectChanges();

      await user.click(screen.getByRole("button", { name: "Submit" }));

      expect(emitSpy).toHaveBeenCalledWith(SELECTED_UPGRADE_IMPACT_ID);
    });

    it.each([
      { optionLabel: "Keep Existing Description", overrideDescription: false },
      { optionLabel: "Upgrade Impact Description", overrideDescription: true },
    ])(
      "emits the description override choice when one of the option is chosen",
      async ({ optionLabel, overrideDescription }) => {
        const user = userEvent.setup();
        const { fixture } = await renderComponent({
          showDescriptionOverrideOption: true,
        });

        const emitSpy = jest.spyOn(
          fixture.componentInstance.overrideBinaryImpactDescriptionChange,
          "emit"
        );
        ngMocks
          .find(fixture, UpgradeImpactSelectionTableComponent)
          .componentInstance.selectedUpgradeImpactIdChange.emit(
            SELECTED_UPGRADE_IMPACT_ID
          );
        fixture.detectChanges();
        await user.click(screen.getByRole("radio", { name: optionLabel }));

        await user.click(screen.getByRole("button", { name: "Submit" }));

        expect(emitSpy).toHaveBeenCalledWith(overrideDescription);
      }
    );

    it("closes the dialog", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.selectedUpgradeImpactIdChange.emit(
          SELECTED_UPGRADE_IMPACT_ID
        );
      fixture.detectChanges();

      await user.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => expect(screen.queryByText(DIALOG_TITLE)).toBeNull());
    });
  });

  describe("cancelling", () => {
    it("closes the dialog", async () => {
      const user = userEvent.setup();
      await renderComponent();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByText(DIALOG_TITLE)).toBeNull());
    });

    it("resets the selected upgrade impact to the initial value", async () => {
      const user = userEvent.setup();
      const INITIAL_SELECTED_UPGRADE_IMPACT_ID =
        "initial-selected-upgrade-impact-id";
      const { fixture, rerender } = await renderComponent({
        isVisible: false,
        selectedUpgradeImpactId: INITIAL_SELECTED_UPGRADE_IMPACT_ID,
      });

      await rerender({
        inputs: {
          isVisible: true,
          selectedUpgradeImpactId: INITIAL_SELECTED_UPGRADE_IMPACT_ID,
        },
      });

      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.selectedUpgradeImpactIdChange.emit(
          SELECTED_UPGRADE_IMPACT_ID
        );
      fixture.detectChanges();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(fixture.componentInstance.selectedUpgradeImpactId).toEqual(
        INITIAL_SELECTED_UPGRADE_IMPACT_ID
      );
    });
  });

  describe("warning messages", () => {
    it("shows a warning message reported by the table", async () => {
      const { fixture } = await renderComponent();

      const warningMessage = "Warning message";
      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.warningMessage.emit(warningMessage);
      fixture.detectChanges();

      expect(screen.getByText(warningMessage)).toBeTruthy();
    });
  });

  describe("errors", () => {
    it("shows an error toast when the table reports an error", async () => {
      const { fixture } = await renderComponent();

      ngMocks
        .find(fixture, UpgradeImpactSelectionTableComponent)
        .componentInstance.errorMessage.emit("Boom");
      fixture.detectChanges();

      expect(mockToastMessageService.showError).toHaveBeenCalledWith("Boom");
    });
  });

  describe("refreshing", () => {
    it("refreshes the table when the user clicks refresh", async () => {
      const user = userEvent.setup();
      const { fixture } = await renderComponent();
      const fetchSpy = jest.spyOn(
        ngMocks.find(fixture, UpgradeImpactSelectionTableComponent)
          .componentInstance,
        "fetchUpgradeImpacts"
      );

      await user.click(screen.getByTestId("refresh-button"));

      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("hiding the selection capability", () => {
    it("hides the submit button", async () => {
      await renderComponent({ hideSelection: true });

      expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();
    });

    it("hides the cancel button", async () => {
      await renderComponent({ hideSelection: true });

      expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    });

    it("hides the description override option", async () => {
      const { fixture } = await renderComponent({
        hideSelection: true,
        showDescriptionOverrideOption: true,
      });

      expect(
        ngMocks.find(fixture, OverrideBinaryImpactDescriptionComponent, null)
      ).toBeNull();
    });
  });

  describe("validation scope", () => {
    it("passes the updated scope to the table when the setter emits a new scope", async () => {
      const { fixture } = await renderComponent();

      ngMocks
        .find(fixture, ValidationScopeSetterComponent)
        .componentInstance.validationScopeChange.emit(VALIDATION_SCOPE);
      fixture.detectChanges();

      expect(
        ngMocks.find(fixture, UpgradeImpactSelectionTableComponent)
          .componentInstance.validationScope
      ).toEqual(VALIDATION_SCOPE);
    });
  });
});
