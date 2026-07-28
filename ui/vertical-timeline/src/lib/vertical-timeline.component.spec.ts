import { ComponentFixture, TestBed } from "@angular/core/testing";
import { VerticalTimelineComponent } from "./vertical-timeline.component";
import { VerticalTimelineStageStatus } from "./stage/vertical-timeline-stage";

describe("VerticalTimelineComponent", () => {
  let component: VerticalTimelineComponent;
  let fixture: ComponentFixture<VerticalTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalTimelineComponent],
    });

    fixture = TestBed.createComponent(VerticalTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it.each([
    [
      VerticalTimelineStageStatus.RUNNING,
      {
        "stage-running": true,
        "stage-passed": false,
        "stage-failed": false,
      },
    ],
    [
      VerticalTimelineStageStatus.PASSED,
      {
        "stage-running": false,
        "stage-passed": true,
        "stage-failed": false,
      },
    ],
    [
      VerticalTimelineStageStatus.FAILED,
      {
        "stage-running": false,
        "stage-passed": false,
        "stage-failed": true,
      },
    ],
  ])(
    "getStageSeparatorStyleClass should return the corresponding style class",
    (status, expectedStyles) => {
      expect(component.getStageSeparatorStyleClass(status)).toStrictEqual(
        expectedStyles
      );
    }
  );
});
