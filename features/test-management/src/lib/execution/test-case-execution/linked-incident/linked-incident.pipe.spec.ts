import { LinkedIncidentPipe } from "./linked-incident.pipe";
import {
  INCIDENT_1,
  INCIDENT_2,
} from "../../analysis-object-link/analysis-object-link-test-utils";

describe("LinkedIncidentPipe", () => {
  let pipe: LinkedIncidentPipe;

  beforeEach(() => {
    pipe = new LinkedIncidentPipe();
  });

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should transform linked incident data into a comma separated string of linked incident external issue ids", () => {
    const linkedIncident = getLinkedIncident();
    const expectedTransformedData = `${INCIDENT_ID_1}, ${INCIDENT_ID_2}`;
    const actualTransformedData = pipe.transform(linkedIncident);
    expect(actualTransformedData).toEqual(expectedTransformedData);
  });

  it("should return an empty string when linked incident data is empty", () => {
    const linkedIncident: any[] = [];
    const actualTransformedData = pipe.transform(linkedIncident);
    expect(actualTransformedData).toEqual("");
  });
});

const INCIDENT_ID_1 = "incidentId1";
const INCIDENT_ID_2 = "incidentId2";

function getLinkedIncident() {
  return [
    {
      ...INCIDENT_1,
      externalIssue: {
        id: INCIDENT_ID_1,
        origin: "ext origin 1",
        link: "ext link 1",
      },
    },
    {
      ...INCIDENT_2,
      externalIssue: {
        id: INCIDENT_ID_2,
        origin: "ext origin 2",
        link: "ext link 2",
      },
    },
  ];
}
