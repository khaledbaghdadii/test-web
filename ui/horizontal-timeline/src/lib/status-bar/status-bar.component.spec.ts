import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StatusBarComponent } from "./status-bar.component";
import { StageStatus } from "./stage-status";
import { Stage } from "./stage";

describe("Status bar component", () => {
  let fixture: ComponentFixture<StatusBarComponent>;
  let statusBar: StatusBarComponent;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StatusBarComponent],
    });

    fixture = TestBed.createComponent(StatusBarComponent);
    statusBar = fixture.componentInstance;
  });

  test.each([
    [StageStatus.ABORTED],
    [StageStatus.ABORTING],
    [StageStatus.FAILED],
    [StageStatus.FAILED_TO_START],
    [StageStatus.NA],
    [StageStatus.NOT_STARTED],
    [StageStatus.PASSED],
    [StageStatus.PENDING_INPUT],
    [StageStatus.RUNNING],
    [StageStatus.SKIPPED],
    [StageStatus.STOPPED],
  ])(
    "select stage should send event unless status is not started",
    (status: StageStatus) => {
      const stage: Stage = {
        name: "stageName",
        status: status,
      };
      let eventData = "";
      statusBar.onStageSelected.subscribe((data) => {
        eventData = data;
      });
      statusBar.selectStage(stage);
      if (status === StageStatus.NOT_STARTED) {
        expect(eventData).toBe("");
      } else {
        expect(eventData).toBe("stageName");
      }
    }
  );

  test.each([
    [StageStatus.ABORTED],
    [StageStatus.ABORTING],
    [StageStatus.FAILED],
    [StageStatus.FAILED_TO_START],
    [StageStatus.NA],
    [StageStatus.NOT_STARTED],
    [StageStatus.PASSED],
    [StageStatus.PENDING_INPUT],
    [StageStatus.RUNNING],
    [StageStatus.SKIPPED],
    [StageStatus.STOPPED],
  ])(
    "is stage failed should return true only if status is failed",
    (status: StageStatus) => {
      let result = statusBar.isStageFailed(status);
      if (status == StageStatus.FAILED) {
        expect(result).toBe(true);
      } else {
        expect(result).toBe(false);
      }
    }
  );

  test.each([
    [StageStatus.ABORTED],
    [StageStatus.ABORTING],
    [StageStatus.FAILED],
    [StageStatus.FAILED_TO_START],
    [StageStatus.NA],
    [StageStatus.NOT_STARTED],
    [StageStatus.PASSED],
    [StageStatus.PENDING_INPUT],
    [StageStatus.RUNNING],
    [StageStatus.SKIPPED],
    [StageStatus.STOPPED],
  ])(
    "get stage classes should return only stage class if stage names are different and stage disabled if status is not started",
    (status: StageStatus) => {
      let stage: Stage = {
        name: "name1",
        status: status,
      };
      let expectedResult: string[];
      if (status === StageStatus.NOT_STARTED) {
        expectedResult = ["stage", "", "stage-disabled"];
      } else {
        expectedResult = ["stage", "", ""];
      }
      statusBar.selectedStage = {
        name: "name2",
        status: StageStatus.RUNNING,
      };
      let actualResult: string[] = statusBar.getStageClasses(stage);
      expect(actualResult).toEqual(expectedResult);
    }
  );

  it("get stage classes should return stage selected if stage names match", () => {
    let stage: Stage = {
      name: "name1",
      status: StageStatus.RUNNING,
    };
    let selectedStage = {
      name: "name1",
      status: StageStatus.RUNNING,
    };
    let expectedResult = ["stage", "stage-selected", ""];
    statusBar.selectedStage = selectedStage;
    let actualResult: string[] = statusBar.getStageClasses(stage);
    expect(actualResult).toEqual(expectedResult);
  });
});
