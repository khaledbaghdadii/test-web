export { ReferenceEnvironmentService } from "./lib/upgrade-process/reference-environments.service";
export { DeployReferenceResourceService } from "./lib/common/deploy-reference-resource.service";
export type { DeployReferenceResourceRequest } from "./lib/common/models/deploy-reference-resource-request";
export { UpgradeProcessStateUpdaterService } from "./lib/upgrade-process/upgrade-process-state-updater.service";
export { BuildAndTestProcessStateUpdaterService } from "./lib/build-and-test/build-and-test-process-state-updater/build-and-test-process-state-updater.service";
export { BuildAndTestEnvironmentResolverService } from "./lib/build-and-test/build-and-test-environment-resolver/build-and-test-environment-resolver.service";
export type { BuildAndTestEnvironment } from "./lib/build-and-test/build-and-test-environment-resolver/build-and-test-environment-resolver.service";
export { BuildAndTestUserInputService } from "./lib/build-and-test/build-and-test-user-input/build-and-test-user-input.service";
export type {
  SendChangesForReviewRequest as BuildAndTestSendChangesForReviewRequest,
  ProceedWithPredefinedInputsRequest,
  ReopenMergeRequestRequest,
  CommitsCherryPickedRequest,
  RepushBackportMergeRequest,
  BackportInput,
} from "./lib/build-and-test/build-and-test-user-input/models/build-and-test-user-input.model";
export { BuildAndTestExecutionsService } from "./lib/build-and-test/build-and-test-executions/build-and-test-executions.service";
export type {
  BuildAndTestExecutionsQuery,
  BuildAndTestExecutionsQueryResult,
  BuildAndTestExecutionSummary,
} from "./lib/build-and-test/build-and-test-executions/models/build-and-test-executions-query.model";
export { BusinessProcessDefinitionService } from "./lib/build-and-test/business-process-definition/business-process-definition.service";
export type {
  BusinessProcessDefinition,
  ProvidedInput,
  BusinessProcessFamily,
  GetBusinessProcessDefinitionsRequest,
} from "./lib/build-and-test/business-process-definition/models/business-process-definition.model";
export { BuildAndTestProcessExecutorService } from "./lib/build-and-test/build-and-test-process-executor/build-and-test-process-executor.service";
export type { ExecuteBuildAndTestProcessRequest } from "./lib/build-and-test/build-and-test-process-executor/execute-build-and-test-process-request";
export type { ExecuteBuildAndTestProcessResponse } from "./lib/build-and-test/build-and-test-process-executor/execute-build-and-test-process-response";
export { BackportProcessExecutorService } from "./lib/backport/backport-process-executor/backport-process-executor.service";
export type { ExecuteBackportProcessRequest } from "./lib/backport/backport-process-executor/execute-backport-process-request";
export type { ExecuteBackportProcessResponse } from "./lib/backport/backport-process-executor/execute-backport-process-response";
export { ExecutionAbortService } from "./lib/execution-abort/execution-abort.service";
export type { AbortExecutionRequest } from "./lib/execution-abort/abort-execution-request";
export { BusinessProcessExecutionEligibilityService } from "./lib/execution/business-process-execution-eligibility.service";
export type {
  EligibilityResponse,
  IneligibilityResult,
} from "./lib/execution/eligibility-response";
export { AllExecutionsService } from "./lib/execution/all-executions/all-executions.service";
export type { AllExecutionSummary } from "./lib/execution/all-executions/models/all-execution-summary";
export { ExecutionResourcesService } from "./lib/execution-resources/execution-resources.service";
export type { ExecutionResource } from "./lib/execution-resources/execution-resource";
export {
  ExecutionResourceType,
  ExecutionResourceUsageTag,
} from "./lib/execution-resources/execution-resource";
export { QualityGateValidationService } from "./lib/upgrade-process/quality-gate-validation.service";
export type { MarkQualityGateFailedRequest } from "./lib/upgrade-process/models/quality-gate.model";
export { SendChangesForReviewService } from "./lib/upgrade-process/send-changes-for-review.service";
export type { SendChangesForReviewRequest } from "./lib/upgrade-process/models/send-changes-for-review.model";
export { WhitelistedFamiliesProvider } from "./lib/whitelisted-families/whitelisted-families-provider.service";
export { FixIssuesService } from "./lib/upgrade-process/fix-issues.service";
export { FurtherAnalysisService } from "./lib/upgrade-process/further-analysis.service";
export type {
  LinkedIncident,
  FurtherAnalysisCandidate,
  FurtherAnalysisCandidatesResponse,
  MarkResourcesForFurtherAnalysisRequest,
  SelectedFurtherAnalysisResource,
  SelectedFurtherAnalysisResourcesResponse,
} from "./lib/upgrade-process/models/further-analysis.model";
export { FactoryProductUpdateService } from "./lib/upgrade-process/factory-product-update.service";
export type {
  UpdateFactoryProductRequest,
  UpdateFactoryProductResponse,
  FactoryProductFileResult,
  FactoryProductUserAction,
  FactoryProductUserActionType,
  FactoryProductUpdateUserActionsResponse,
} from "./lib/upgrade-process/models/factory-product-update.model";
export { ExecutionFetcherService } from "./lib/upgrade-process/execution-fetcher.service";
export { PickReferenceExecutionService } from "./lib/upgrade-process/pick-reference-execution.service";
export { UpgradeProcessListingService } from "./lib/upgrade-process/upgrade-process-listing.service";
export { ReferenceScenariosService } from "./lib/reference-scenario/service/reference-scenario.service";
export { ReferenceScenario } from "./lib/reference-scenario/models/reference-scenario";
export { UpgradeProcessDefinitionExecutorService } from "./lib/upgrade-process/executor/upgrade-process-definition-executor.service";
export type {
  ExecuteUpgradeProcessDefinitionRequest,
  UpgradeProcessMxParameters,
  UpgradeProcessConfigurationParameters,
  UpgradeProcessInfrastructureParameters,
  UpgradeProcessTestParameters,
  UpgradeProcessReferenceEnvironmentParameters,
  FactoryProductRequest,
} from "./lib/upgrade-process/executor/execute-upgrade-process-definition-request";
export type { ExecuteUpgradeProcessDefinitionResponse } from "./lib/upgrade-process/executor/execute-upgrade-process-definition-response";
/**
 * These are legacy types ideally we would reuse the models defined under util in a similar structure to the ones done on the backend
 */
export type { BinaryUpgradeExecutionsQueryRequest } from "./lib/upgrade-process/models/binary-upgrade-executions-query-request";
export type { BinaryUpgradeExecutionsQueryResult } from "./lib/upgrade-process/models/binary-upgrade-executions-query-result";
export type { BinaryUpgradeExecutionSummary } from "./lib/upgrade-process/models/binary-upgrade-executions-query-result";
export { BinaryUpgradeExecutionsTableQuery } from "./lib/upgrade-process/models/binary-upgrade-executions-table-query";
export { ValidationProcessExecutionFetcherService } from "./lib/validation-process/validation-process-execution-fetcher.service";
export { ValidationProcessExecutionMapperService } from "./lib/validation-process/validation-process-execution-mapper.service";
export { ValidationProcessListingService } from "./lib/validation-process/validation-process-listing.service";
export {
  LatestFinalProductFetcherService,
  LatestFinalProductFailureReason,
} from "./lib/validation-process/latest-final-product-fetcher.service";
export type {
  LatestFinalProductResult,
  FetchLatestFinalProductRequest,
} from "./lib/validation-process/latest-final-product-fetcher.service";
export { ValidationProcessExecutorService } from "./lib/validation-process/executor/validation-process-executor.service";
export type { ExecuteValidationProcessRequest } from "./lib/validation-process/executor/execute-validation-process-request";
export type { ExecuteValidationProcessResponse } from "./lib/validation-process/executor/execute-validation-process-response";
export {
  ValidationProcessStateUpdaterService,
  type MarkQualityGatePassedRequest as ValidationProcessMarkQualityGatePassedRequest,
  type MarkQualityGateFailedRequest as ValidationProcessMarkQualityGateFailedRequest,
  type SendChangesForReviewRequest as ValidationProcessSendChangesForReviewRequest,
  type SkipIntegrateChangesRequest as ValidationProcessSkipIntegrateChangesRequest,
} from "./lib/validation-process/validation-process-state-updater.service";
export type { ValidationProcessExecution } from "./lib/validation-process/models/validation-process-execution";
export type { ValidationProcessExecutionInput } from "./lib/validation-process/models/validation-process-execution-input";
export type { ValidationProcessExecutionApiModel } from "./lib/validation-process/models/validation-process-execution-api-model";
export type { ValidationProcessExecutionsQueryRequest } from "./lib/validation-process/models/validation-process-executions-query-request";
export type { ValidationProcessExecutionsQueryResponse } from "./lib/validation-process/models/validation-process-executions-query-response";
export type { ValidationProcessCreateBranchStage } from "./lib/validation-process/models/stage/create-branch/validation-process-create-branch-stage";
export type { ValidationProcessExecuteQualityGateStage } from "./lib/validation-process/models/stage/execute-quality-gate/validation-process-execute-quality-gate-stage";
export type { ValidationProcessTagArchivalStage } from "./lib/validation-process/models/stage/tag-archival-branch/validation-process-tag-archival-stage";
export type { ValidationProcessIntegrateFixesStage } from "./lib/validation-process/models/stage/integrate-fixes/validation-process-integrate-fixes-stage";
export type { ValidationResult } from "./lib/validation-process/models/stage/execute-quality-gate/validation-result";
export type { ArchivalUserStoriesUpdateStatus } from "./lib/validation-process/models/stage/tag-archival-branch/archival-user-stories-update-status";
export type { ArchivalUserStoryUpdate } from "./lib/validation-process/models/stage/tag-archival-branch/archival-user-stories-update-status";
export type { FinalProductPublishing } from "./lib/validation-process/models/stage/integrate-fixes/final-product-publishing";
export { ValidationProcessStageStatus } from "./lib/validation-process/models/stage/validation-process-stage-status";
export { JiraDetailsService } from "./lib/issue-tracking/jira-details.service";
export { SharedJiraDetailsService } from "./lib/issue-tracking/shared-jira-details.service";
export type { JiraDetails } from "./lib/issue-tracking/jira-details";
export type { CiProcessExecutionsQuery } from "./lib/build-and-test/build-and-test-executions/models/ci-process-execution-query";
export type {
  CiProcessExecutionsQueryResult,
  CiProcessExecutionSummary,
} from "./lib/build-and-test/build-and-test-executions/models/ci-process-execution-query-result";

// Migrated project-users list/search (feeds the notifications-recipients
// multiselect). Fetch-by-email was consolidated into user/data-access's
// UserService.fetchUsersByEmails (VAL-27132 follow-up cleanup).
export { ProjectUsersService } from "./lib/project-users/project-users.service";
export type {
  User,
  UsersPageResponse,
  FetchProjectUsersRequest,
} from "./lib/project-users/models/project-user.model";

// Migrated user-story validation (feeds the rebuilt user-story input).
export { ValidateUserStoryService } from "./lib/user-story-validation/validate-user-story.service";
export type {
  ValidateUserStoryRequest,
  ValidateUserStoryResponse,
} from "./lib/user-story-validation/models/validate-user-story.model";
