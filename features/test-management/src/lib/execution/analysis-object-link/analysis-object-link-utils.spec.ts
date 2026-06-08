import { AnalysisObjectLinkUtils } from "./analysis-object-link-utils";
import { AnalysisObjectType } from "@mxflow/features/analysis-objects";

describe("scenario execution analysis object link utils", () => {
  let service: AnalysisObjectLinkUtils;

  beforeEach(() => {
    service = new AnalysisObjectLinkUtils();
  });

  it("should return analysis objects linked only to scenario executions", () => {
    const scenarioExecutionLink = {
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      analysisObjectId: "analysisObjectId",
      analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
    };
    const testExecutionLink = {
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      analysisObjectId: "analysisObjectId",
      analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
      testCaseExecutionId: "testCaseExecutionId",
    };

    const links = service.getScenarioExecutionLinks([
      scenarioExecutionLink,
      testExecutionLink,
    ]);

    expect(links).toEqual([scenarioExecutionLink]);
  });

  it("should return analysis objects linked to test case executions", () => {
    const scenarioExecutionLink = {
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      analysisObjectId: "analysisObjectId",
      analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
    };
    const testExecutionLink = {
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      analysisObjectId: "analysisObjectId",
      analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
      testCaseExecutionId: "testCaseExecutionId",
    };

    const links = service.getTestCaseExecutionLinks([
      scenarioExecutionLink,
      testExecutionLink,
    ]);

    expect(links).toEqual([testExecutionLink]);
  });

  it.each([
    [
      [
        {
          analysisObjectId: "analysisObjectId1",
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        },
        {
          analysisObjectId: "analysisObjectId2",
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        },
      ],
    ],
    [
      [
        {
          analysisObjectId: "analysisObjectId1",
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        },
        {
          analysisObjectId: "analysisObjectId1",
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        },
      ],
    ],
  ])(
    "should return analysis object links to a specific analysis object",
    (analysisObjects) => {
      const links = analysisObjects.map((analysisObject) =>
        generateScenarioAnalysisObjectLink(
          analysisObject.analysisObjectId,
          analysisObject.analysisObjectType,
          "testCaseExecutionId"
        )
      );

      const allLinks = service.getAnalysisObjectLinks(
        links,
        "analysisObjectId1",
        AnalysisObjectType.CONFIGURATION_IMPACT
      );

      expect(allLinks).toEqual([links[0]]);
    }
  );

  it("should return undefined for scenario execution link for a specific analysis object if it does not exist", () => {
    const links = [
      {
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        analysisObjectId: "analysisObjectId1",
        analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
      },
    ];

    const link = service.getAnalysisObjectScenarioExecutionLink(
      links,
      "analysisObjectId2",
      AnalysisObjectType.BINARY_IMPACT
    );

    expect(link).toBeUndefined();
  });

  it("should return undefined for scenario execution link if analysis object type is undefined", () => {
    const links = [
      {
        projectId: "projectId",
        scenarioExecutionId: "scenarioExecutionId",
        analysisObjectId: "analysisObjectId1",
        analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
      },
    ];

    const link = service.getAnalysisObjectScenarioExecutionLink(
      links,
      "analysisObjectId2"
    );

    expect(link).toBeUndefined();
  });

  it("should return the scenario execution link for a specific analysis object if it exists", () => {
    const matchingLink = {
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      analysisObjectId: "analysisObjectId1",
      analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
    };

    const link = service.getAnalysisObjectScenarioExecutionLink(
      [matchingLink],
      "analysisObjectId1",
      AnalysisObjectType.CONFIGURATION_IMPACT
    );

    expect(link).toEqual(matchingLink);
  });

  it.each([
    [
      [
        {
          analysisObjectId: "analysisObjectId1",
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        },
        {
          analysisObjectId: "analysisObjectId2",
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        },
      ],
    ],
    [
      [
        {
          analysisObjectId: "analysisObjectId1",
          analysisObjectType: AnalysisObjectType.CONFIGURATION_IMPACT,
        },
        {
          analysisObjectId: "analysisObjectId1",
          analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
        },
      ],
    ],
  ])(
    "should return analysis objects linked to test case executions for a specific analysis object",
    (analysisObjects) => {
      const links = analysisObjects.map((analysisObject) =>
        generateScenarioAnalysisObjectLink(
          analysisObject.analysisObjectId,
          analysisObject.analysisObjectType,
          "testCaseExecutionId"
        )
      );

      const testCaseExecutionLinks =
        service.getAnalysisObjectTestCaseExecutionLinks(
          links,
          "analysisObjectId1",
          AnalysisObjectType.CONFIGURATION_IMPACT
        );

      expect(testCaseExecutionLinks).toEqual([links[0]]);
    }
  );

  it("should return empty analysis objects linked to test case executions if analysis object type is undefined", () => {
    const links = [
      generateScenarioAnalysisObjectLink(
        "analysisObjectId1",
        AnalysisObjectType.CONFIGURATION_IMPACT,
        "testCaseExecutionId"
      ),
    ];

    const testCaseExecutionLinks =
      service.getAnalysisObjectTestCaseExecutionLinks(
        links,
        "analysisObjectId1"
      );

    expect(testCaseExecutionLinks).toEqual([]);
  });

  it("should return true if analysis object is linked to scenario execution only", () => {
    const analysisObjectLink = generateScenarioAnalysisObjectLink(
      "analysisObjectId",
      AnalysisObjectType.CONFIGURATION_IMPACT
    );

    const isLinked =
      service.isAnalysisObjectLinkedToScenarioExecutionOnly(analysisObjectLink);

    expect(isLinked).toBe(true);
  });

  it("should return false if analysis object is linked to test case execution", () => {
    const analysisObjectLink = generateScenarioAnalysisObjectLink(
      "analysisObjectId",
      AnalysisObjectType.CONFIGURATION_IMPACT,
      "testCaseExecutionId"
    );

    const isLinked =
      service.isAnalysisObjectLinkedToScenarioExecutionOnly(analysisObjectLink);

    expect(isLinked).toBe(false);
  });

  function generateScenarioAnalysisObjectLink(
    analysisObjectId: string,
    analysisObjectType: AnalysisObjectType,
    testCaseExecutionId?: string
  ) {
    return {
      projectId: "projectId",
      scenarioExecutionId: "scenarioExecutionId",
      analysisObjectId: analysisObjectId,
      analysisObjectType: analysisObjectType,
      testCaseExecutionId: testCaseExecutionId,
    };
  }
});
