import { DisplayClientImpactNoteListFieldPipe } from "./client-impact-note-field-list-display.pipe";

describe("Client Impact Note Field List Display Pipe", () => {
  let pipe: DisplayClientImpactNoteListFieldPipe;

  beforeEach(() => {
    pipe = new DisplayClientImpactNoteListFieldPipe();
  });

  it("should return - when field is undefined", () => {
    expect(pipe.transform()).toEqual("-");
  });

  it("should - when field list is empty", () => {
    expect(pipe.transform([])).toEqual("-");
  });

  it("should format the list correctly when list contains elements", () => {
    expect(
      pipe.transform([
        { id: "id1", name: "name1" },
        { id: "id2", name: "name2" },
      ])
    ).toEqual("name1,  name2");
  });
});
