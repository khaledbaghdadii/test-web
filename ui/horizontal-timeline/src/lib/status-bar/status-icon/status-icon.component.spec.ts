import { StatusIconComponent } from "./status-icon.component";
import { StageStatus } from "../stage-status";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StageStatusColorSelectorPipeModule } from "../../stage-status-color-selector-pipe/stage-status-color-selector-pipe.module";
import { StageStatusIconSelectorPipeModule } from "../../stage-status-icon-selector-pipe/stage-status-icon-selector-pipe.module";
import { By } from "@angular/platform-browser";

describe("status icon component test", () => {
  let component: StatusIconComponent;
  let fixture: ComponentFixture<StatusIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StatusIconComponent,
        StageStatusColorSelectorPipeModule,
        StageStatusIconSelectorPipeModule,
      ],
    });
    fixture = TestBed.createComponent(StatusIconComponent);
    component = fixture.componentInstance;
  });

  type StatusIconDataSet = [status: StageStatus, icon: string];

  it.each<StatusIconDataSet>([
    [StageStatus.NA, "pi-clock"],
    [StageStatus.FAILED, "pi-times-circle"],
    [StageStatus.FAILED_TO_START, "pi-times-circle"],
    [StageStatus.PASSED, "pi-check-circle"],
    [StageStatus.RUNNING, "pi-spinner"],
    [StageStatus.NOT_STARTED, "pi-clock"],
    [StageStatus.ON_HOLD, "pi-pause-circle"],
    [StageStatus.PENDING_INPUT, "pi-exclamation-triangle"],
    [StageStatus.SKIPPED, "pi-chevron-circle-right"],
    [StageStatus.STOPPED, "pi-ban"],
    [StageStatus.CANCELED, "pi-minus-circle"],
  ])("should show for %s status this %s icon", (status, icon) => {
    component.status = status;

    fixture.detectChanges();

    const span = fixture.debugElement.query(
      By.css('[data-testid="stage-status-icon"]')
    );
    expect(span.classes["pi"]).toBeTruthy();
    expect(span.classes[icon]).toBeTruthy();
  });
});
