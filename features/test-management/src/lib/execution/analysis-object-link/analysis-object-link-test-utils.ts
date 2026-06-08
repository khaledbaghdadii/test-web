import { Incident } from "@mxflow/features/incident-management";
import {
  AnalysisObjectLink,
  TestCaseExecutionAnalysisObjectLinkModel,
} from "./analysis-object-link";
import { UpdateAnalysisObjectLinkRequestGeneratorInput } from "./analysis-object-linking/update-analysis-object-link-request-generator.service";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
  AnalysisObjectType,
} from "@mxflow/features/analysis-objects";

export const projectId = "projectId";
export const scenarioExecutionId = "scenarioExecutionId";
export const testCaseExecutionId1 = "testCaseExecutionId1";
export const testCaseExecutionId3 = "testCaseExecutionId3";
export const analysisObjectId1 = "analysisObjectId1";
export const analysisObjectType1 = "analysisObjectType1";
export const testCaseExecutionId2 = undefined;
export const analysisObjectId2 = "analysisObjectId2";
export const analysisObjectId3 = "analysisObjectId3";
export const analysisObjectType2 = "analysisObjectType2";
export const analysisObjectType3 = "analysisObjectType3";
export const incidentId = "incidentId";
export const incidentId2 = "incidentId2";

export const INCIDENT_1 = {
  id: incidentId,
  title: "title1",
  status: "status1",
  externalIssue: {
    id: "ext id 1",
    origin: "ext origin 1",
    link: "ext link 1",
  },
} as unknown as Incident;

export const INCIDENT_2 = {
  id: incidentId2,
  title: "title2",
  status: "status2",
  externalIssue: {
    id: "ext id 2",
    origin: "ext origin 2",
    link: "ext link 2",
  },
} as unknown as Incident;

export const incidents: Incident[] = [INCIDENT_1, INCIDENT_2];

export const configurationRegressionId = "123";
export const binaryRegressionId = "binaryRegressionId";
export const configurationImpactId = "configurationImpactId";
export const binaryImpactId = "binaryImpactId";
export const binaryImpactId2 = "binaryImpactId2";
export const LITE_CONFIGURATION_REGRESSION_1 = {
  id: configurationRegressionId,
  title: "Regression 1 Title",
  guiltyChange: "Guilty Change for Regression 1",
  owner: "Owner 1",
  fix: "",
  projectId: "",
};
export const LITE_BINARY_REGRESSION_1 = {
  id: binaryRegressionId,
  title: "Binary Regression 1 Title",
  mxVersion: "Binary mx version 1",
  defect: {
    id: "id",
    link: "link",
  },
  owner: "Binary Owner 1",
  fix: "Binary fix 1",
  projectId: "Binary project 1",
};

export const LITE_BINARY_IMPACT_1 = {
  id: binaryImpactId,
  title: "title1",
  owner: "owner",
  mxVersion: "mxVersion",
  projectId: "projectId",
  upgradeImpact: {
    id: "upgradeImpactId",
    externalIssue: {
      id: "upgradeImpactExternalIssueId",
      link: "upgradeImpactExternalIssueLink",
    },
  },
};
export const LITE_BINARY_IMPACT_2 = {
  id: binaryImpactId2,
  title: "title2",
  owner: "owner",
  mxVersion: "mxVersion",
  projectId: "projectId",
  upgradeImpact: {
    id: "upgradeImpactId",
    externalIssue: {
      id: "upgradeImpactExternalIssueId",
      link: "upgradeImpactExternalIssueLink",
    },
  },
};

export const ANALYSIS_OBJECT_1 = {
  id: analysisObjectId1,
} as AnalysisObject;

export const ANALYSIS_OBJECT_2 = {
  id: analysisObjectId2,
} as AnalysisObject;

export const analysisObjectLink1: AnalysisObjectLink = {
  projectId: projectId,
  scenarioExecutionId: scenarioExecutionId,
  testCaseExecutionId: testCaseExecutionId1,
  analysisObjectId: analysisObjectId1,
  analysisObjectType: analysisObjectType1,
};

export const analysisObjectLink2: AnalysisObjectLink = {
  projectId: projectId,
  scenarioExecutionId: scenarioExecutionId,
  testCaseExecutionId: testCaseExecutionId2,
  analysisObjectId: analysisObjectId2,
  analysisObjectType: analysisObjectType2,
};

export const analysisObjectLink3: AnalysisObjectLink = {
  projectId: projectId,
  scenarioExecutionId: scenarioExecutionId,
  testCaseExecutionId: testCaseExecutionId3,
  analysisObjectId: analysisObjectId3,
  analysisObjectType: analysisObjectType3,
};

export const updateLinksRequestGeneratorDefaultInput: UpdateAnalysisObjectLinkRequestGeneratorInput =
  {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    analysisObjectType: AnalysisObjectType.BINARY_IMPACT,
    initialAnalysisObjectLinks: [],
    initiallyLinkedAnalysisObjectsState: [],
    testCaseExecutions: [],
    currentAnalysisObjectsSelectionState: [],
    isScenarioExecutionSelected: false,
  };

export function getAnalysisObjectLinkWithEmptyTestCaseExecution(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testCaseExecutionId: undefined,
    analysisObjectId: analysisObjectId1,
    analysisObjectType: analysisObjectType,
  };
}

export function getAnalysisObjectLink1(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testCaseExecutionId: testCaseExecutionId1,
    analysisObjectId: analysisObjectId1,
    analysisObjectType: analysisObjectType,
  };
}

export function getAnalysisObjectLink2(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    projectId: projectId,
    scenarioExecutionId: scenarioExecutionId,
    testCaseExecutionId: testCaseExecutionId2,
    analysisObjectId: analysisObjectId2,
    analysisObjectType: analysisObjectType,
  };
}

export function getAnalysisObjectLink3(
  analysisObjectType: AnalysisObjectType
): AnalysisObjectLink {
  return {
    ...analysisObjectLink3,
    analysisObjectType: analysisObjectType,
  };
}

export function getInitiallyPartiallyLinkedAnalysisObject(
  id: string
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: { id: id } as AnalysisObject,
    selectionType: AnalysisObjectSelectionType.PARTIAL,
  };
}

export function getInitiallyFullyLinkedAnalysisObject(
  id: string
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: { id: id } as AnalysisObject,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

export function getFullySelectedAnalysisObject<T extends AnalysisObject>(
  analysisObject: T
): AnalysisObjectSelectionState<T> {
  return {
    analysisObject: analysisObject,
    selectionType: AnalysisObjectSelectionType.FULL,
  };
}

export function getPartiallySelectedAnalysisObject(
  analysisObject: AnalysisObject
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: analysisObject,
    selectionType: AnalysisObjectSelectionType.PARTIAL,
  };
}

export function getUnselectedAnalysisObject(
  analysisObject: AnalysisObject
): AnalysisObjectSelectionState<AnalysisObject> {
  return {
    analysisObject: analysisObject,
    selectionType: AnalysisObjectSelectionType.NONE,
  };
}

export const testCaseExecutionAnalysisObjectLinkModel: TestCaseExecutionAnalysisObjectLinkModel =
  {
    testCaseExecutionId: testCaseExecutionId1,
    analysisObjectId: analysisObjectId1,
    analysisObjectType: analysisObjectType1,
  };

export const testCaseExecutionAnalysisObjectLinkModel2: TestCaseExecutionAnalysisObjectLinkModel =
  {
    testCaseExecutionId: testCaseExecutionId2,
    analysisObjectId: analysisObjectId2,
    analysisObjectType: analysisObjectType2,
  };
