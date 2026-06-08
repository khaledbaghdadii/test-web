import { Incident } from "./model/incident.model";
import { IncidentLinksChangedPipe } from "./incident-links-changed.pipe";

describe("IncidentLinksChangedPipe", () => {
  const initialIncidentSelection = [
    { id: "1" } as Incident,
    { id: "2" } as Incident,
  ];
  const currentIncidentSelection: Incident[] = [
    { id: "1" } as Incident,
    { id: "2" } as Incident,
    { id: "3" } as Incident,
  ];

  const pipe = new IncidentLinksChangedPipe();

  it("create an instance", () => {
    expect(pipe).toBeTruthy();
  });

  it("should return false if no changes", () => {
    expect(
      pipe.transform(
        initialIncidentSelection,
        currentIncidentSelection.slice(0, 2)
      )
    ).toBeFalsy();
  });

  it("should return true if user selected a new incident", () => {
    expect(
      pipe.transform(initialIncidentSelection, currentIncidentSelection)
    ).toBeTruthy();
  });

  it("should return true if a user unselected a incident", () => {
    expect(
      pipe.transform(initialIncidentSelection, [currentIncidentSelection[0]])
    ).toBe(true);
  });

  it("should return true if a user unselected an existing incident and selected a different one", () => {
    expect(
      pipe.transform(initialIncidentSelection, [
        currentIncidentSelection[0],
        currentIncidentSelection[2],
      ])
    ).toBe(true);
  });

  it("should return false if initial and current selections are empty", () => {
    expect(pipe.transform([], [])).toBeFalsy();
  });

  it("should return true if initial selection is empty and current selection is not", () => {
    expect(pipe.transform([], currentIncidentSelection)).toBeTruthy();
  });

  it("should return true if current selection is empty and initial selection is not", () => {
    expect(pipe.transform(initialIncidentSelection, [])).toBeTruthy();
  });
});
