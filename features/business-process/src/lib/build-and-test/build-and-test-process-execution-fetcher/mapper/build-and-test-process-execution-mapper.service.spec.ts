import { BuildAndTestProcessExecutionMapperService } from "./build-and-test-process-execution-mapper.service";
import { BuildAndTestProcessStageStatus } from "../../stage/build-and-test-process-stage-status";
import { BuildAndTestProcessStage } from "../../stage/build-and-test-process-stage";
import { Stage, StageStatus } from "@mxflow/ui/horizontal-timeline";

describe("ci process execution mapper", () => {
  const createBranchName = "create branch";
  const prepareBuildName = "prepare build";
  const BP_PASSED_STATUS = StageStatus.PASSED;
  const BP_FAILED_STATUS = StageStatus.FAILED;
  const CI_PASSED_STATUS = BuildAndTestProcessStageStatus.PASSED;
  const CI_FAILED_STATUS = BuildAndTestProcessStageStatus.FAILED;
  const createBranchStartDate = "2023-03-22T08:10:29.817713Z";
  const createBranchEndDate = "2023-03-22T08:10:32.918853Z";
  const prepareBuildStartDate = "2024-03-22T08:10:29.817713Z";
  const prepareBuildEndDate = "2024-03-22T08:10:32.918853Z";
  const route = "route";

  const businessProcessExecutionStages: Stage[] = [
    {
      name: createBranchName,
      status: BP_PASSED_STATUS,
      startDate: createBranchStartDate,
      endDate: createBranchEndDate,
    },
    {
      name: prepareBuildName,
      status: BP_FAILED_STATUS,
      startDate: prepareBuildStartDate,
      endDate: prepareBuildEndDate,
    },
  ];
  const ciProcessExecutionStages: BuildAndTestProcessStage[] = [
    {
      name: createBranchName,
      status: CI_PASSED_STATUS,
      startDate: createBranchStartDate,
      endDate: createBranchEndDate,
      route: route,
    },
    {
      name: prepareBuildName,
      status: CI_FAILED_STATUS,
      startDate: prepareBuildStartDate,
      endDate: prepareBuildEndDate,
      route: route,
    },
  ];

  const mapper: BuildAndTestProcessExecutionMapperService =
    new BuildAndTestProcessExecutionMapperService();

  it("should map the ci process stage correctly to generic process execution stage", () => {
    expect(mapper.toStage(ciProcessExecutionStages[0])).toEqual(
      businessProcessExecutionStages[0]
    );
  });

  it("should map the ci process stages correctly to generic process execution stages", () => {
    expect(mapper.toExecutionStages(ciProcessExecutionStages)).toEqual(
      businessProcessExecutionStages
    );
  });
});
