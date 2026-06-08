import { KeepEnvironmentsIncidentsCellRendererComponent } from "./keep-environments-incidents-cell-renderer.component";
import type { LinkedIncident } from "@mxevolve/domains/business-process/data-access";
import { ICellRendererParams } from "ag-grid-enterprise";

const incidents: LinkedIncident[] = [
  {
    id: "incidentId1",
    externalIssueId: "INC-1",
    externalIssueLink: "https://jira.murex.com/browse/INC-1",
  },
  {
    id: "incidentId2",
    externalIssueId: "INC-2",
    externalIssueLink: "https://jira.murex.com/browse/INC-2",
  },
];

function buildParams(
  overrides: Partial<ICellRendererParams> = {}
): ICellRendererParams {
  return {
    value: [],
    ...overrides,
  } as unknown as ICellRendererParams;
}

describe("KeepEnvironmentsIncidentsCellRendererComponent", () => {
  let component: KeepEnvironmentsIncidentsCellRendererComponent;

  beforeEach(() => {
    component = new KeepEnvironmentsIncidentsCellRendererComponent();
  });

  it("given a cell with incidents, then the user sees the list of incidents", () => {
    component.agInit(
      buildParams({
        value: incidents as unknown as ICellRendererParams,
      })
    );

    expect(component.incidents).toEqual(incidents);
  });

  it("given a cell with no incidents, then no incidents are shown", () => {
    component.agInit(
      buildParams({
        value: undefined as unknown as ICellRendererParams,
      })
    );

    expect(component.incidents).toEqual([]);
  });

  it("given an incident is clicked, then the link navigates directly to the corresponding external link", () => {
    component.agInit(buildParams());

    expect(component.getIncidentLink(incidents[0])).toBe(
      incidents[0].externalIssueLink
    );
  });

  it("given a cell already rendered, when the incident data changes, then the cell updates to show the new incidents", () => {
    component.agInit(
      buildParams({
        value: incidents as unknown as ICellRendererParams,
      })
    );

    const result = component.refresh(
      buildParams({
        value: incidents as unknown as ICellRendererParams,
      })
    );

    expect(component.incidents).toEqual(incidents);
    expect(result).toBe(true);
  });
});
