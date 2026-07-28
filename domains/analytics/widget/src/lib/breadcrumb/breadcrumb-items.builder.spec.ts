import type {
  BreadcrumbNode,
  BreadcrumbResponse,
} from "@mxevolve/domains/analytics/data-access";
import { BreadcrumbItemsBuilder } from "./breadcrumb-items.builder";

const builder = new BreadcrumbItemsBuilder();

function node(
  partial: Partial<BreadcrumbNode> & Pick<BreadcrumbNode, "type">
): BreadcrumbNode {
  return { projectId: "p1", available: true, siblings: [], ...partial };
}

function response(target: BreadcrumbNode): BreadcrumbResponse {
  return { target };
}

describe("BreadcrumbItemsBuilder", () => {
  it("prepends a Home item linking to /home", () => {
    const items = builder.build(
      response(node({ type: "PROJECT", id: "p1", name: "Proj" }))
    );

    expect(items[0]).toEqual({ label: "Home", url: "/home" });
  });

  it("links the project node to the project home page", () => {
    const project = node({ type: "PROJECT", id: "p1", name: "Proj" });
    const scenario = node({
      type: "SCENARIO",
      id: "s1",
      name: "Scn",
      parent: project,
    });

    expect(builder.build(response(scenario))[1].url).toBe("/app/p1/home");
  });

  it("labels the project node with its name", () => {
    const project = node({ type: "PROJECT", id: "p1", name: "Proj" });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: project });

    expect(builder.build(response(scenario))[1].label).toBe("Proj");
  });

  it("builds the business-process URL from the execution id", () => {
    const bp = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__abc",
      name: "My BP",
    });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: bp });

    expect(builder.build(response(scenario))[1].url).toBe(
      "/app/p1/business-process/upgrade-processes/execution/binary-upgrade__abc"
    );
  });

  it("labels the business-process node with its name", () => {
    const bp = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__abc",
      name: "My BP",
    });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: bp });

    expect(builder.build(response(scenario))[1].label).toBe("My BP");
  });

  it("builds the scenario URL from the scenario id", () => {
    const scenario = node({ type: "SCENARIO", id: "s1", name: "Scn" });
    const environment = node({
      type: "ENVIRONMENT",
      id: "e1",
      parent: scenario,
    });

    expect(builder.build(response(environment))[1].url).toBe(
      "/app/p1/test/execution/details/s1"
    );
  });

  it("builds the environment URL from the environment id", () => {
    const environment = node({ type: "ENVIRONMENT", id: "e1" });
    const request = node({
      type: "ENVIRONMENT_REQUEST",
      id: "r1",
      parent: environment,
    });

    expect(builder.build(response(request))[1].url).toBe(
      "/app/p1/environments/e1"
    );
  });

  it("labels the environment node with a static label", () => {
    const environment = node({ type: "ENVIRONMENT", id: "e1" });
    const request = node({
      type: "ENVIRONMENT_REQUEST",
      id: "r1",
      parent: environment,
    });

    expect(builder.build(response(request))[1].label).toBe("Environment");
  });

  it("builds the merge-request URL from the merge-request id", () => {
    const mr = node({ type: "MERGE_REQUEST", id: "m1", name: "MR title" });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: mr });

    expect(builder.build(response(scenario))[1].url).toBe(
      "/app/p1/scm/merge-requests/m1"
    );
  });

  it("labels a single merge-request node with a static label", () => {
    const mr = node({ type: "MERGE_REQUEST", id: "m1", name: "MR title" });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: mr });

    expect(builder.build(response(scenario))[1].label).toBe("Merge Request");
  });

  it("disables an unavailable parent node", () => {
    const environment = node({ type: "ENVIRONMENT", available: false });
    const request = node({
      type: "ENVIRONMENT_REQUEST",
      id: "r1",
      parent: environment,
    });

    expect(builder.build(response(request))[1].disabled).toBe(true);
  });

  it("does not link an unavailable parent node", () => {
    const environment = node({ type: "ENVIRONMENT", available: false });
    const request = node({
      type: "ENVIRONMENT_REQUEST",
      id: "r1",
      parent: environment,
    });

    expect(builder.build(response(request))[1].url).toBeUndefined();
  });

  it("does not link the leaf node", () => {
    const environment = node({ type: "ENVIRONMENT", id: "e1" });

    const items = builder.build(response(environment));

    expect(items[items.length - 1].url).toBeUndefined();
  });

  it("renders a bulk level as a dropdown of every alternative", () => {
    const bpA = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__a",
      name: "BP A",
      siblings: [
        node({
          type: "BUSINESS_PROCESS",
          id: "master-validation__b",
          name: "BP B",
        }),
      ],
    });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: bpA });

    expect(builder.build(response(scenario))[1].dropdown).toHaveLength(2);
  });

  it("labels each dropdown entry with the resource title", () => {
    const bpA = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__a",
      name: "BP A",
      siblings: [
        node({
          type: "BUSINESS_PROCESS",
          id: "master-validation__b",
          name: "BP B",
        }),
      ],
    });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: bpA });

    expect(builder.build(response(scenario))[1].dropdown?.[0].label).toBe(
      "BP A"
    );
  });

  it("builds each dropdown entry URL under its own business-process family", () => {
    const bpA = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__a",
      name: "BP A",
      siblings: [
        node({
          type: "BUSINESS_PROCESS",
          id: "master-validation__b",
          name: "BP B",
        }),
      ],
    });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: bpA });

    expect(builder.build(response(scenario))[1].dropdown?.[1].url).toBe(
      "/app/p1/business-process/validation-processes/execution/master-validation__b"
    );
  });

  it("does not link the bulk-level item itself", () => {
    const bpA = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__a",
      name: "BP A",
      siblings: [
        node({
          type: "BUSINESS_PROCESS",
          id: "master-validation__b",
          name: "BP B",
        }),
      ],
    });
    const scenario = node({ type: "SCENARIO", id: "s1", parent: bpA });

    expect(builder.build(response(scenario))[1].url).toBeUndefined();
  });

  it("renders dropdowns for multiple bulk levels from each node's own siblings", () => {
    const project = node({
      type: "PROJECT",
      id: "p1",
      name: "Proj",
    });

    const bpA = node({
      type: "BUSINESS_PROCESS",
      id: "binary-upgrade__a",
      name: "BP A",
      parent: project,
      siblings: [
        node({
          type: "BUSINESS_PROCESS",
          id: "master-validation__b",
          name: "BP B",
        }),
      ],
    });

    const mrA = node({
      type: "MERGE_REQUEST",
      id: "mr-a",
      name: "MR A",
      parent: bpA,
      siblings: [
        node({
          type: "MERGE_REQUEST",
          id: "mr-b",
          name: "MR B",
        }),
      ],
    });

    const scenario = node({
      type: "SCENARIO",
      id: "s1",
      name: "Scenario 1",
      parent: mrA,
    });

    const items = builder.build(response(scenario));

    expect(items[2].label).toBe("BP A");
    expect(items[2].dropdown).toHaveLength(2);
    expect(items[2].dropdown?.map((item) => item.label)).toEqual([
      "BP A",
      "BP B",
    ]);

    expect(items[3].label).toBe("Merge Request");
    expect(items[3].dropdown).toHaveLength(2);
    expect(items[3].dropdown?.map((item) => item.label)).toEqual([
      "MR A",
      "MR B",
    ]);
  });
});
