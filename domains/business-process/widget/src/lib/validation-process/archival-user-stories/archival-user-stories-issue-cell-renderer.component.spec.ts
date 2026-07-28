import {
  ArchivalUserStoriesIssueCellRendererComponent,
  IssueCellRendererParams,
} from "./archival-user-stories-issue-cell-renderer.component";

function buildParams(
  overrides: Partial<IssueCellRendererParams> = {}
): IssueCellRendererParams {
  return {
    value: "VAL-1",
    jiraBaseUrl: "https://jira.example.com",
    ...overrides,
  } as IssueCellRendererParams;
}

describe("ArchivalUserStoriesIssueCellRendererComponent", () => {
  let component: ArchivalUserStoriesIssueCellRendererComponent;

  beforeEach(() => {
    component = new ArchivalUserStoriesIssueCellRendererComponent();
  });

  describe("agInit", () => {
    it("stores the jira base URL from the params", () => {
      component.agInit(buildParams());

      expect(component.jiraBaseUrl).toBe("https://jira.example.com");
    });

    it("stores the user story id from the params value", () => {
      component.agInit(buildParams({ value: "VAL-42" }));

      expect(component.userStoryId).toBe("VAL-42");
    });

    it("falls back to an empty jira base URL when none is provided", () => {
      component.agInit(
        buildParams({ jiraBaseUrl: undefined as unknown as string })
      );

      expect(component.jiraBaseUrl).toBe("");
    });

    it("falls back to an empty user story id when the value is missing", () => {
      component.agInit(buildParams({ value: undefined }));

      expect(component.userStoryId).toBe("");
    });
  });

  describe("refresh", () => {
    it("updates the jira base URL from the new params", () => {
      component.agInit(buildParams());

      component.refresh(buildParams({ jiraBaseUrl: "https://jira.new.com" }));

      expect(component.jiraBaseUrl).toBe("https://jira.new.com");
    });

    it("updates the user story id from the new params", () => {
      component.agInit(buildParams());

      component.refresh(buildParams({ value: "VAL-99" }));

      expect(component.userStoryId).toBe("VAL-99");
    });

    it("returns true so ag-grid reuses the renderer", () => {
      expect(component.refresh(buildParams())).toBe(true);
    });
  });
});
