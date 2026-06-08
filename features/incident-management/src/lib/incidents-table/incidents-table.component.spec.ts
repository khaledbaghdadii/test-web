import { IncidentsTableComponent } from "./incidents-table.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Incident } from "@mxflow/features/incident-management";
import { DomTestUtils } from "@mxevolve/testing";

describe("incident component", () => {
  let component: IncidentsTableComponent;
  let fixture: ComponentFixture<IncidentsTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IncidentsTableComponent],
    });
    fixture = TestBed.createComponent(IncidentsTableComponent);
    component = fixture.componentInstance;
    component.incidents = [INCIDENT];
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should handle unlinking correctly", () => {
    jest.spyOn(component.unlinkIncident, "emit");
    getUnlinkButtonHarness().click();
    expect(component.unlinkIncident.emit).toHaveBeenCalledWith(ID);
  });

  function getUnlinkButtonHarness() {
    return DomTestUtils.getButtonByTestId(
      fixture,
      "unlink-incident-button-" + ID
    );
  }
});

const ID = "incidentId";
const TITLE = "title1";
const STATUS = "status1";
const EXTERNAL_ISSUE_ID = "ext id 1";
const EXTERNAL_ISSUE_ORIGIN = "ext origin 1";
const EXTERNAL_ISSUE_LINK = "ext link 1";
const INCIDENT: Incident = {
  id: ID,
  title: TITLE,
  status: STATUS,
  externalIssue: {
    id: EXTERNAL_ISSUE_ID,
    origin: EXTERNAL_ISSUE_ORIGIN,
    link: EXTERNAL_ISSUE_LINK,
  },
};
