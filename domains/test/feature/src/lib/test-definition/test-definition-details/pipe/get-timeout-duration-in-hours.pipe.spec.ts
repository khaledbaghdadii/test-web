import { TimeoutDuration } from "@mxevolve/domains/test/model";
import { GetTimeoutDurationInHoursPipe } from "./get-timeout-duration-in-hours.pipe";

describe("GetTimeoutDurationInHoursPipe", () => {
  let getTimeoutDurationInHoursPipe: GetTimeoutDurationInHoursPipe;
  let timeoutDuration: TimeoutDuration;
  beforeEach(() => {
    getTimeoutDurationInHoursPipe = new GetTimeoutDurationInHoursPipe();
  });
  it("create an instance", () => {
    expect(getTimeoutDurationInHoursPipe).toBeTruthy();
  });

  it("should return the correct timeout duration in hours", () => {
    timeoutDuration = {
      days: 1,
      hours: 2,
      minutes: 30,
    };
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(26.5);
  });

  it("should return the correct timeout duration in hours if days is null", () => {
    timeoutDuration = {
      days: null,
      hours: 2,
      minutes: 30,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(2.5);
  });

  it("should return the correct timeout duration in hours if hours is null", () => {
    timeoutDuration = {
      days: 1,
      hours: null,
      minutes: 30,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(24.5);
  });

  it("should return the correct timeout duration in hours if minutes is null", () => {
    timeoutDuration = {
      days: 1,
      hours: 2,
      minutes: null,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(26);
  });

  it("should return the correct timeout duration in hours if all values are null", () => {
    timeoutDuration = {
      days: null,
      hours: null,
      minutes: null,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(0);
  });

  it("should return the correct timeout duration in hours if all values are 0", () => {
    timeoutDuration = {
      days: 0,
      hours: 0,
      minutes: 0,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(0);
  });

  it("should return the correct timeout duration in hours if days is 0", () => {
    timeoutDuration = {
      days: 0,
      hours: 2,
      minutes: 30,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(2.5);
  });

  it("should return the correct timeout duration in hours if hours is 0", () => {
    timeoutDuration = {
      days: 1,
      hours: 0,
      minutes: 30,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(24.5);
  });

  it("should return the correct timeout duration in hours if minutes is 0", () => {
    timeoutDuration = {
      days: 1,
      hours: 2,
      minutes: 0,
    } as unknown as TimeoutDuration;
    expect(getTimeoutDurationInHoursPipe.transform(timeoutDuration)).toBe(26);
  });
});
