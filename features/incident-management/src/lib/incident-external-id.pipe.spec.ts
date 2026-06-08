import { Subject, lastValueFrom } from "rxjs";
import { TestBed } from "@angular/core/testing";
import { Incident } from "./model/incident.model";
import { IncidentService } from "./incident.service";
import { IncidentExternalLinkPipe } from "./incident-external-id.pipe";

function createIncident(
  id: string,
  externalIssueId: string,
  externalLink: string
): Incident {
  return {
    id,
    title: "Test Incident",
    status: "Open",
    externalIssue: {
      id: externalIssueId,
      origin: "Jira",
      link: externalLink,
    },
  };
}

describe("IncidentExternalLinkPipe", () => {
  let pipe: IncidentExternalLinkPipe;
  let incidentService: jest.Mocked<IncidentService>;
  let fetchSubject: Subject<Incident[]>;

  const mockIncident = createIncident(
    "INC-001",
    "JIRA-101",
    "https://jira.example.com/JIRA-101"
  );

  beforeEach(() => {
    fetchSubject = new Subject<Incident[]>();

    const mockIncidentService = {
      fetchIncidentsByIds: jest.fn(() => fetchSubject.asObservable()),
    };

    TestBed.configureTestingModule({
      providers: [
        IncidentExternalLinkPipe,
        { provide: IncidentService, useValue: mockIncidentService },
      ],
    });

    pipe = TestBed.inject(IncidentExternalLinkPipe);
    incidentService = TestBed.inject(
      IncidentService
    ) as jest.Mocked<IncidentService>;
  });

  function completeFetch(incidents: Incident[]) {
    fetchSubject.next(incidents);
    fetchSubject.complete();
  }

  function failFetch(error: Error) {
    fetchSubject.error(error);
  }

  describe("Displaying External Link", () => {
    it("given a valid incident id, when the incident is fetched, then the external issue link should be returned", async () => {
      const resultPromise = lastValueFrom(pipe.transform("INC-001"));
      completeFetch([mockIncident]);
      const result = await resultPromise;
      expect(incidentService.fetchIncidentsByIds).toHaveBeenCalledWith([
        "INC-001",
      ]);
      expect(result).toEqual({
        id: "JIRA-101",
        link: "https://jira.example.com/JIRA-101",
      });
    });
  });

  describe("Handling Missing or Invalid Input", () => {
    it("given an undefined incident id, then null should be returned without attempting to fetch the incident", async () => {
      const result$ = await lastValueFrom(pipe.transform(undefined));
      expect(result$).toBeNull();
      expect(incidentService.fetchIncidentsByIds).not.toHaveBeenCalled();
    });

    it("given an empty string incident id, then null should be returned without attempting to fetch the incident", async () => {
      const result$ = await lastValueFrom(pipe.transform(""));
      expect(result$).toBeNull();
      expect(incidentService.fetchIncidentsByIds).not.toHaveBeenCalled();
    });
  });

  describe("Handling Errors and Edge Cases", () => {
    it("given the incident is not found, then null should be returned", async () => {
      const resultPromise = lastValueFrom(pipe.transform("INC-NONEXISTING"));
      completeFetch([]);
      const result = await resultPromise;
      expect(result).toBeNull();
    });

    it("given the service fails with an error, then null should be returned", async () => {
      const result$ = pipe.transform("INC-001");
      failFetch(new Error("Service failure"));
      const result = await lastValueFrom(result$);
      expect(result).toBeNull();
    });
  });
});
