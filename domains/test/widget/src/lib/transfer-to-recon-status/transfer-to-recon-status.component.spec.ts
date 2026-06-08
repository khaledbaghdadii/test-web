import { render, screen } from "@testing-library/angular";
import { TransferToReconStatusComponent } from "./transfer-to-recon-status.component";
import {
  TransferToReconProgressStatus,
  TransferToReconProgressStatusDisplayValue,
} from "@mxevolve/domains/test/model";
import { TagModule } from "primeng/tag";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { MockComponent, ngMocks } from "ng-mocks";

async function renderComponent(
  status: TransferToReconProgressStatus | undefined
) {
  return render(TransferToReconStatusComponent, {
    inputs: { status },
    imports: [TagModule, MockComponent(MxevolveIconComponent)],
  });
}

describe("TransferToReconStatusComponent", () => {
  describe("status tag severity", () => {
    const cases: { status: TransferToReconProgressStatus; severity: string }[] =
      [
        {
          status: TransferToReconProgressStatus.PASSED,
          severity: "success",
        },
        { status: TransferToReconProgressStatus.FAILED, severity: "danger" },
        { status: TransferToReconProgressStatus.IN_PROGRESS, severity: "warn" },
      ];

    it.each(cases)(
      "should render $status status with $severity severity",
      async ({ status, severity }) => {
        const { fixture } = await renderComponent(status);
        const tag = fixture.nativeElement.querySelector(`.p-tag-${severity}`);
        expect(tag).toBeTruthy();
      }
    );
  });

  describe("status label rendering", () => {
    const labelCases: { status: TransferToReconProgressStatus }[] = [
      { status: TransferToReconProgressStatus.PASSED },
      { status: TransferToReconProgressStatus.FAILED },
      { status: TransferToReconProgressStatus.IN_PROGRESS },
    ];

    it.each(labelCases)(
      "should display correct label for $status status",
      async ({ status }) => {
        await renderComponent(status);
        expect(
          screen.getByText(TransferToReconProgressStatusDisplayValue[status])
        ).toBeTruthy();
      }
    );
  });

  describe("icon rendering", () => {
    const iconCases: { status: TransferToReconProgressStatus; icon: string }[] =
      [
        {
          status: TransferToReconProgressStatus.PASSED,
          icon: "check_circle",
        },
        { status: TransferToReconProgressStatus.FAILED, icon: "cancel" },
        {
          status: TransferToReconProgressStatus.IN_PROGRESS,
          icon: "progress_activity",
        },
      ];

    it.each(iconCases)(
      "should render $icon icon for $status status",
      async ({ status, icon }) => {
        const { fixture } = await renderComponent(status);
        const iconComponent = ngMocks.find(fixture, MxevolveIconComponent);
        expect(ngMocks.input(iconComponent, "name")).toBe(icon);
      }
    );
  });
});
