import { TableLazyLoadEvent } from "primeng/table";
import { IncidentPage } from "./model/incident-page.model";
import { Incident } from "./model/incident.model";
import { IncidentTableRowSelectionState } from "./incidents-selection-table/incidents-selection-table.component";
import { IncidentsQueryParams } from "@mxflow/features/incident-management";

export const INCIDENT_1: Incident = {
  id: "id1",
  title: "title1",
  status: "status1",
  reporter: "reporter1",
  assignee: "assignee1",
  externalIssue: {
    id: "idd1",
    origin: "origin1",
    link: "link1",
  },
};

export const INCIDENT_2: Incident = {
  id: "id2",
  title: "title2",
  status: "status2",
  reporter: "reporter2",
  assignee: "assignee2",
  externalIssue: {
    id: "idd2",
    origin: "origin2",
    link: "link2",
  },
};

export function getIncidents(): Incident[] {
  return [INCIDENT_1, INCIDENT_2];
}

export const INCIDENTS: Incident[] = [INCIDENT_1, INCIDENT_2];

export const INCIDENT_STATUSES = ["status 1", "status 2"];

export const INCIDENT_STATUS_OPTIONS = [
  {
    text: "status 1",
    value: "status 1",
  },
  {
    text: "status 2",
    value: "status 2",
  },
];

export const INCIDENT_TABLE_LAZY_LOAD_EVENT: TableLazyLoadEvent = {
  first: 0,
  rows: 10,
};

export const INCIDENTS_QUERY: IncidentsQueryParams = {
  page: 0,
  size: 10,
};

export const INCIDENT_SECOND_PAGE: IncidentPage = {
  content: [INCIDENT_1, INCIDENT_2],
  totalPages: 2,
  totalElements: 2,
  size: 2,
  number: 2,
  last: true,
};

export function getFullyCheckedIncident(
  incident: Incident
): IncidentTableRowSelectionState {
  return {
    incident: incident,
    selectionState: {
      checked: true,
      partialSelected: false,
    },
  };
}
