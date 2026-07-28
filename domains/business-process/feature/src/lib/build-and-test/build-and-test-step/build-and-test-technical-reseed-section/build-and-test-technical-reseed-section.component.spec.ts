import { render } from "@testing-library/angular";
import { MockComponent, ngMocks } from "ng-mocks";
import { BusinessProcessContentContainerComponent } from "@mxevolve/domains/business-process/ui";
import { TechnicalReseedSectionComponent } from "@mxevolve/domains/environment/widget";
import { BuildAndTestTechnicalReseedSectionComponent } from "./build-and-test-technical-reseed-section.component";

async function renderComponent() {
  return render(BuildAndTestTechnicalReseedSectionComponent, {
    imports: [
      MockComponent(BusinessProcessContentContainerComponent),
      MockComponent(TechnicalReseedSectionComponent),
    ],
    inputs: {
      projectId: "project-001",
      executionGroupId: "reseed-group-001",
      infraGroup: "infra-group-001",
      targetBranch: "feature/temp-branch",
    },
  });
}

describe("BuildAndTestTechnicalReseedSectionComponent", () => {
  it("wraps the technical reseed section in a business process content container", async () => {
    await renderComponent();

    const container = ngMocks.find(BusinessProcessContentContainerComponent);

    expect(ngMocks.input(container, "header")).toBe("Technical Reseed");
    expect(ngMocks.input(container, "collapsable")).toBe(true);
  });

  it("forwards the build-and-test inputs to the technical reseed section", async () => {
    await renderComponent();

    const section = ngMocks.find(TechnicalReseedSectionComponent);

    expect(ngMocks.input(section, "projectId")).toBe("project-001");
    expect(ngMocks.input(section, "executionGroupId")).toBe("reseed-group-001");
    expect(ngMocks.input(section, "infraGroup")).toBe("infra-group-001");
    expect(ngMocks.input(section, "targetBranch")).toBe("feature/temp-branch");
  });

  it("re-emits reloadRequested from the technical reseed section", async () => {
    const { fixture } = await renderComponent();
    const launchedSpy = jest.fn();
    fixture.componentInstance.reloadRequested.subscribe(launchedSpy);

    const section = ngMocks.find(TechnicalReseedSectionComponent);
    ngMocks.output(section, "reloadRequested").emit();

    expect(launchedSpy).toHaveBeenCalled();
  });
});
