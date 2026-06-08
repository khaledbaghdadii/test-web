import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { IncidentsListComponent } from "./incidents-list.component";
import { Incident } from "@mxflow/features/incident-management";
import { DebugElement } from "@angular/core";
import { Tooltip } from "primeng/tooltip";

const INCIDENT_ID_1 = "INC-001";
const INCIDENT_ID_2 = "INC-002";
const INCIDENT_ID_3 = "INC-003";
const INCIDENT_LINK_1 = "https://example.com/incident/1";
const INCIDENT_LINK_2 = "https://example.com/incident/2";
const INCIDENT_LINK_3 = "https://example.com/incident/3";

describe("incidents list component", () => {
  let component: IncidentsListComponent;
  let fixture: ComponentFixture<IncidentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsListComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    fixture.componentRef.setInput("incidents", []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should display incidents list container when incidents exist", () => {
    fixture.componentRef.setInput("incidents", getIncidents());
    fixture.detectChanges();

    const incidentsList = fixture.debugElement.query(By.css("#incidents-list"));
    expect(incidentsList).toBeTruthy();
  });

  it("should display correct number of incident links", () => {
    fixture.componentRef.setInput("incidents", getIncidents());
    fixture.detectChanges();

    const links = fixture.debugElement.queryAll(By.css("a"));
    expect(links.length).toBe(3);
  });

  it("should display first incident with correct text", () => {
    fixture.componentRef.setInput("incidents", getIncidents());
    fixture.detectChanges();

    const firstIncident = fixture.debugElement.query(
      By.css("#incident-INC-001 a")
    );
    expect(firstIncident.nativeElement.textContent.trim()).toBe(INCIDENT_ID_1);
  });

  it("should display first incident with correct link", () => {
    fixture.componentRef.setInput("incidents", getIncidents());
    fixture.detectChanges();

    const firstIncident = fixture.debugElement.query(
      By.css(`#incident-${INCIDENT_ID_1} a`)
    );
    expect(firstIncident.nativeElement.href).toBe(INCIDENT_LINK_1);
  });

  it("should display second incident with correct text", () => {
    fixture.componentRef.setInput("incidents", getIncidents());
    fixture.detectChanges();

    const secondIncident = fixture.debugElement.query(
      By.css(`#incident-${INCIDENT_ID_2} a`)
    );
    expect(secondIncident.nativeElement.textContent.trim()).toBe(INCIDENT_ID_2);
  });

  it("should contain comma separators in incidents list", () => {
    fixture.componentRef.setInput("incidents", getIncidents());
    fixture.detectChanges();

    const incidentsList = fixture.debugElement.query(By.css("#incidents-list"));
    expect(incidentsList.nativeElement.textContent).toContain(",");
  });

  it("should display empty incidents list when no incidents exist", () => {
    fixture.componentRef.setInput("incidents", []);
    fixture.detectChanges();

    const emptyList = fixture.debugElement.query(
      By.css("#empty-incidents-list")
    );
    expect(emptyList).toBeTruthy();
  });

  it("should display dash when incidents list is empty", () => {
    fixture.componentRef.setInput("incidents", []);
    fixture.detectChanges();

    const emptyList = fixture.debugElement.query(
      By.css("#empty-incidents-list")
    );
    expect(emptyList.nativeElement.textContent.trim()).toBe("-");
  });

  it("should not display incidents list container when empty", () => {
    fixture.componentRef.setInput("incidents", []);
    fixture.detectChanges();

    const incidentsList = fixture.debugElement.query(By.css("#incidents-list"));
    expect(incidentsList).toBeFalsy();
  });

  it("should open incident link in new tab", () => {
    fixture.componentRef.setInput("incidents", [getIncident1()]);
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css("#incident-INC-001 a"));
    expect(link.nativeElement.target).toBe("_blank");
  });

  describe("incidents tooltip", () => {
    it("should return empty string when no incidents exist", () => {
      fixture.componentRef.setInput("incidents", []);
      expect(component.incidentsTooltip()).toBe("");
    });

    it("should return the incidents IDs joined by comma", () => {
      fixture.componentRef.setInput("incidents", getIncidents());
      const expectedTooltip = `${INCIDENT_ID_1}, ${INCIDENT_ID_2}, ${INCIDENT_ID_3}`;
      expect(component.incidentsTooltip()).toBe(expectedTooltip);
    });

    it("should recompute tooltip when incidents input changes", () => {
      fixture.componentRef.setInput("incidents", []);
      expect(component.incidentsTooltip()).toBe("");
      fixture.componentRef.setInput("incidents", [getIncident1()]);
      expect(component.incidentsTooltip()).toBe(INCIDENT_ID_1);
    });

    it("should display the tooltip on hover", () => {
      fixture.componentRef.setInput("incidents", getIncidents());
      fixture.detectChanges();
      const domElement: DebugElement = fixture.debugElement.query(
        By.css(`[id="incidents-list"]`)
      );

      const tooltipDirective = domElement.injector.get(Tooltip);
      expect(tooltipDirective.getOption("tooltipLabel") as string).toBe(
        `${INCIDENT_ID_1}, ${INCIDENT_ID_2}, ${INCIDENT_ID_3}`
      );
    });
  });
});

function getIncidents(): Incident[] {
  return [getIncident1(), getIncident2(), getIncident3()];
}

function getIncident1() {
  return {
    externalIssue: {
      id: INCIDENT_ID_1,
      link: INCIDENT_LINK_1,
    },
  } as Incident;
}
function getIncident2() {
  return {
    externalIssue: {
      id: INCIDENT_ID_2,
      link: INCIDENT_LINK_2,
    },
  } as Incident;
}

function getIncident3() {
  return {
    externalIssue: {
      id: INCIDENT_ID_3,
      link: INCIDENT_LINK_3,
    },
  } as Incident;
}
