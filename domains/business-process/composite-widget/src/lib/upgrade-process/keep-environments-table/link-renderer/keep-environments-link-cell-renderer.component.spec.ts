import { KeepEnvironmentsLinkCellRendererComponent } from "./keep-environments-link-cell-renderer.component";
import type { LinkCellRendererParams } from "./keep-environments-link-cell-renderer.component";

function buildParams(
  overrides: Partial<LinkCellRendererParams> = {}
): LinkCellRendererParams {
  return {
    data: {},
    value: "cell value",
    linkTemplate: () => "/app/some-route",
    ...overrides,
  } as LinkCellRendererParams;
}

describe("KeepEnvironmentsLinkCellRendererComponent", () => {
  let component: KeepEnvironmentsLinkCellRendererComponent;

  beforeEach(() => {
    component = new KeepEnvironmentsLinkCellRendererComponent();
  });

  it("given a cell with a link, then the user sees a link to the correct page", () => {
    component.agInit(
      buildParams({ linkTemplate: () => "/app/project/environments/env-1" })
    );

    expect(component.link).toBe("/app/project/environments/env-1");
    expect(component.tag).toBeNull();
  });

  it("given a cell with a tag label, then the user sees the tag badge next to the link", () => {
    component.agInit(buildParams({ tagLabel: () => "Ref env" }));

    expect(component.tag).toBe("Ref env");
  });

  it("given a cell without a tag label, then no badge is shown", () => {
    component.agInit(buildParams({ tagLabel: () => null }));

    expect(component.tag).toBeNull();
  });

  it("given a cell already rendered, when the row data changes, then the link updates to reflect the new data", () => {
    component.agInit(buildParams({ linkTemplate: () => "/app/old-route" }));

    const result = component.refresh(
      buildParams({ linkTemplate: () => "/app/new-route" })
    );

    expect(component.link).toBe("/app/new-route");
    expect(result).toBe(true);
  });
});
