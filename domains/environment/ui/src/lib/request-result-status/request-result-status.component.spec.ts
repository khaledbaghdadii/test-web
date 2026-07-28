import { render, screen } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { Tag } from "primeng/tag";
import { Tooltip } from "primeng/tooltip";
import { MxevolveIconComponent } from "@mxevolve/shared/ui/primitive";
import { RequestResultStatusComponent } from "./request-result-status.component";

const MOCK_IMPORTS = [MockComponent(MxevolveIconComponent), Tag, Tooltip];

async function renderComponent(inputs: {
  status: string;
  resultStatus?: string;
  resultMessage?: string;
}) {
  return render(RequestResultStatusComponent, {
    inputs,
    componentImports: MOCK_IMPORTS,
  });
}

describe("RequestResultStatusComponent", () => {
  it("shows the 'Success' title for a successful result", async () => {
    await renderComponent({ status: "ENDED", resultStatus: "SUCCESS" });

    expect(screen.getByText("Success")).toBeTruthy();
  });

  it("renders a successful result with 'success' severity", async () => {
    const { fixture } = await renderComponent({
      status: "ENDED",
      resultStatus: "SUCCESS",
    });

    const tag = ngMocks.find(fixture, Tag);
    expect(ngMocks.input(tag, "severity")).toBe("success");
  });

  it("shows 'N/A' for an unfinished result", async () => {
    await renderComponent({ status: "EXECUTING" });

    expect(screen.getByText("N/A")).toBeTruthy();
  });

  it("shows the 'Failure' title for a failed result", async () => {
    await renderComponent({ status: "ENDED", resultStatus: "FAILURE" });

    expect(screen.getByText("Failure")).toBeTruthy();
  });

  it("renders an info icon when the result failed", async () => {
    const { fixture } = await renderComponent({
      status: "ENDED",
      resultStatus: "FAILURE",
      resultMessage: "boom",
    });

    const icon = ngMocks.find(fixture, MxevolveIconComponent);
    expect(ngMocks.input(icon, "name")).toBe("info");
  });

  it("display a message for the user to guide them to click to see more details", async () => {
    const { fixture } = await renderComponent({
      status: "ENDED",
      resultStatus: "FAILURE",
      resultMessage: "boom",
    });

    const tooltip = ngMocks.findInstance(fixture, Tooltip);
    expect(tooltip.content).toBe("Click to see more details");
  });

  it("does not render an info icon for a successful result", async () => {
    const { fixture } = await renderComponent({
      status: "ENDED",
      resultStatus: "SUCCESS",
    });

    expect(ngMocks.findAll(fixture, MxevolveIconComponent)).toHaveLength(0);
  });
});
