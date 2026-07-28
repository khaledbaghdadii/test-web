import { Incident } from "./model/incident.model";

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
