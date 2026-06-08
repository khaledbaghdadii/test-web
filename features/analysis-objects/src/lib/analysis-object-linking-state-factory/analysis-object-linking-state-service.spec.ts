import { AnalysisObjectLinkingStateService } from "./analysis-object-linking-state-service";

class DummyLinkingStateService extends AnalysisObjectLinkingStateService {}

describe("AnalysisObjectLinkingStateService", () => {
  let service: AnalysisObjectLinkingStateService;

  beforeEach(() => {
    service = new DummyLinkingStateService();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("isLinking", () => {
    it("should initially be false", () => {
      expect(service.isLinking()).toBe(false);
    });

    it.each([true, false])(
      "setIsLinking should update the isLinking signal",
      (isLinking) => {
        service.setIsLinking(isLinking);
        expect(service.isLinking()).toBe(isLinking);
      }
    );
  });

  describe("isCreating", () => {
    it("should initially be false", () => {
      expect(service.isCreating()).toBe(false);
    });

    it.each([true, false])(
      "setIsCreating should update the isCreating signal",
      (isCreating) => {
        service.setIsCreating(isCreating);
        expect(service.isCreating()).toBe(isCreating);
      }
    );
  });

  describe("reset", () => {
    it("should iniially have isReset set to undefined", () => {
      expect(service.reset()).toBeUndefined();
    });

    it("reset should emit a reset event", () => {
      const resetSpy = jest.spyOn(service.reset$, "next");
      service.reset();
      expect(resetSpy).toHaveBeenCalled();
    });

    it("reset should set isLinking to false", () => {
      service.setIsLinking(true);
      service.reset();
      expect(service.isLinking()).toBe(false);
    });

    it("reset should set isCreating to false", () => {
      service.setIsCreating(true);
      service.reset();
      expect(service.isCreating()).toBe(false);
    });
  });
});
