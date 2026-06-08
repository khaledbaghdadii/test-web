import { FailureReasonDetailsTableComponent } from "./failure-reason-details-table.component";
import { FailureReason } from "../failure-reason";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DomTestUtils } from "@mxevolve/testing";
import { ButtonModule } from "primeng/button";

describe("FailureReasonDetailsTableComponent", () => {
  const failureReasonId = "1";
  let component: FailureReasonDetailsTableComponent;
  let fixture: ComponentFixture<FailureReasonDetailsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FailureReasonDetailsTableComponent, ButtonModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FailureReasonDetailsTableComponent);
    component = fixture.componentInstance;
    component.reasons = [
      {
        id: failureReasonId,
      } as unknown as FailureReason,
    ];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit unlink request on unlinkFailureReason", () => {
    jest.spyOn(component.unlinkFailureReasonRequestEvent, "emit");
    getUnlinkButtonHarness().click();
    expect(component.unlinkFailureReasonRequestEvent.emit).toHaveBeenCalledWith(
      failureReasonId
    );
  });

  function getUnlinkButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      `unlink-button-${failureReasonId}`
    );
  }
});
