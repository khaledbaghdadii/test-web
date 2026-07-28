import { ToggleTooltipPipe } from "./toggle-tooltip.pipe";

describe("ToggleTooltipPipe", () => {
  it("returns undefined when the value is undefined", () => {
    const pipe = new ToggleTooltipPipe();

    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it("returns the include message when the environment is excluded", () => {
    const pipe = new ToggleTooltipPipe();

    expect(pipe.transform(true)).toEqual(
      "By disabling this toggle, you are including the machines of the environment in the WRP"
    );
  });

  it("returns the exclude message when the environment is included", () => {
    const pipe = new ToggleTooltipPipe();

    expect(pipe.transform(false)).toEqual(
      "By enabling this toggle, you are excluding the machines of the environment from the WRP"
    );
  });
});
