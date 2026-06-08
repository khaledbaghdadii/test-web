import { RejectionReasonMapperService } from "./rejection-reason-mapper.service";

describe("RejectionReasonMapperService", () => {
  let service: RejectionReasonMapperService;

  beforeEach(() => {
    service = new RejectionReasonMapperService();
  });

  it("should return empty message if rejection reasons are undefined", () => {
    expect(service.map(undefined as unknown as string[])).toEqual("");
  });
  it("should return empty message if no rejection reasons exist", () => {
    expect(service.map([])).toEqual("");
  });
  it("should return correct message if one rejection reason exists", () => {
    expect(service.map(["LIMIT_REACHED"])).toEqual(
      "Concurrent scenario executions limit has been reached"
    );
  });
  it("should return correct message if multiple rejection reasons exist", () => {
    expect(service.map(["UNDERWAY_SCENARIO", "LIMIT_REACHED"])).toEqual(
      "Concurrent scenario executions limit has been reached"
    );
  });
});
