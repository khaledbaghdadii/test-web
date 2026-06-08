import { FunctionalTechnicalRebaseApiRequest } from "./request/functional-technical-rebase-api-request";
import { catchError, Observable, throwError } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { HttpClient, HttpParams } from "@angular/common/http";
import { SaveBundleChangesApiRequest } from "./request/save-bundle-changes-api-request";
import { ApplyBundleChangesApiRequest } from "./request/apply-bundle-changes-api-request";
import { GetRebaseOperationInfoApiResponse } from "./response/get-rebase-operation-info-api-response";
import { ResetChangesApiRequest } from "./request/reset-changes-api-request";
import { CommitChangesApiRequest } from "./request/commit-changes-api-request";
import { ErrorHandler } from "../error-handling/error-handler";
import { ReadRemoteFileContentApiRequest } from "./request/read-remote-file-content-api-request";
import { ReadRemoteFileContentApiResponse } from "./response/read-remote-file-content-api-response";
import { GetConflictingDiffVersionsApiRequest } from "./request/get-conflicting-diff-versions-api-request";
import { GetConflictingDiffVersionsApiResponse } from "./response/get-conflicting-diff-versions-api-response";
import { SourceTreeEntryApiResponse } from "./response/source-tree-entry-api-response";
import { WriteRemoteFileContentApiRequest } from "./request/write-remote-file-content-api-request";
import { DeleteRemoteFileApiRequest } from "./request/delete-remote-file-api-request";
import { StageFileChangesApiRequest } from "./request/stage-file-changes-api-request";
import { RemoteClonedRepositoryStateApiResponse } from "./response/get-remote-cloned-repository-state-api-response";
import { CreateRemoteDirectoryApiRequest } from "./request/create-remote-directory-api-request";
import { DeleteRemoteDirectoryApiRequest } from "./request/delete-remote-directory-api-request";
import { ChangedFileApiResponse } from "./response/changed-file-api-response";

@Injectable()
export class RemoteClonedRepositoryService {
  private readonly http = inject(HttpClient);
  apiUrl: string = inject<AppConfig>(APP_CONFIG).gatewayUrl + "scm-operations/";

  constructor() {}

  startRemoteClonedRepositoryFunctionalTechnicalRebase(
    request: FunctionalTechnicalRebaseApiRequest
  ): Observable<void> {
    return this.http
      .post<void>(
        this.constructStartFunctionalTechnicalUri(request),
        request.payload
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  saveBundleChanges(request: SaveBundleChangesApiRequest): Observable<void> {
    return this.http
      .post<void>(
        this.constructSaveFunctionalFixesUri(request),
        request.payload
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  applyFunctionalFixes(
    request: ApplyBundleChangesApiRequest
  ): Observable<void> {
    return this.http
      .post<void>(this.constructApplyFunctionalFixesUri(request), null)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  continueRebase(
    projectId: string,
    remoteClonedRepositoryId: string
  ): Observable<void> {
    return this.http
      .post<void>(
        this.constructContinueRebaseUri(projectId, remoteClonedRepositoryId),
        null
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getRebaseOperationInfo(
    projectId: string,
    remoteClonedRepositoryId: string
  ): Observable<GetRebaseOperationInfoApiResponse> {
    return this.http
      .get<GetRebaseOperationInfoApiResponse>(
        this.constructGetRebaseOperationInfoUri(
          projectId,
          remoteClonedRepositoryId
        )
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getRemoteClonedRepositoryState(
    projectId: string,
    remoteClonedRepositoryId: string
  ): Observable<RemoteClonedRepositoryStateApiResponse> {
    return this.http
      .get<RemoteClonedRepositoryStateApiResponse>(
        this.constructGetRemoteClonedRepositoryStateUri(
          projectId,
          remoteClonedRepositoryId
        )
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getRemoteRepositorySourceTree(
    projectId: string,
    remoteRepositoryId: string,
    subDirectoryPath?: string,
    minDepth?: number,
    maxDepth?: number
  ): Observable<SourceTreeEntryApiResponse[]> {
    let params = new HttpParams();

    if (subDirectoryPath) {
      params = params.set("subDirectoryPath", subDirectoryPath);
    }

    if (minDepth !== undefined) {
      params = params.set("minDepth", String(minDepth));
    }

    if (maxDepth !== undefined) {
      params = params.set("maxDepth", String(maxDepth));
    }

    return this.http
      .get<SourceTreeEntryApiResponse[]>(
        this.constructGetRemoteRepositorySourceTreeUri(
          projectId,
          remoteRepositoryId
        ),
        { params }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getChangedFiles(
    projectId: string,
    remoteRepositoryId: string
  ): Observable<ChangedFileApiResponse[]> {
    return this.http
      .get<ChangedFileApiResponse[]>(
        this.constructGetChangedFilesUri(projectId, remoteRepositoryId)
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  commitChanges(request: CommitChangesApiRequest): Observable<void> {
    return this.http
      .post<void>(this.constructCommitChangesUri(request), {
        branchName: request.branchName,
        filesToCommit: request.fileAndDirectoryPathsToCommit,
        commitMessage: request.commitMessage,
        commitAuthorDetails: request.commitAuthorDetails,
      })
      .pipe(
        catchError((error) =>
          throwError(() => ErrorHandler.createScmOperationError(error))
        )
      );
  }

  resetChanges(request: ResetChangesApiRequest): Observable<void> {
    return this.http
      .post<void>(this.constructResetChangesUri(request), {
        paths: request.fileAndDirectoryPathsToReset,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  writeRemoteFileContent(
    request: WriteRemoteFileContentApiRequest
  ): Observable<void> {
    return this.http
      .post<void>(this.constructRemoteFileUri(request), {
        filePath: request.filePath,
        fileContent: request.fileContent,
        checkRepositoryAvailability: request.checkRepositoryAvailability,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  createRemoteDirectory(
    request: CreateRemoteDirectoryApiRequest
  ): Observable<void> {
    return this.http
      .post<void>(this.constructRemoteDirectoryUri(request), {
        directoryPath: request.directoryPath,
        checkRepositoryAvailability: request.checkRepositoryAvailability,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  deleteRemoteDirectory(
    request: DeleteRemoteDirectoryApiRequest
  ): Observable<void> {
    return this.http
      .post<void>(this.constructRemoteDirectoryDeleteUri(request), {
        directoryPath: request.directoryPath,
        checkRepositoryAvailability: request.checkRepositoryAvailability,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  deleteRemoteFile(request: DeleteRemoteFileApiRequest): Observable<void> {
    return this.http
      .delete<void>(this.constructRemoteFileUri(request), {
        params: {
          filePath: request.filePath,
          checkRepositoryAvailability:
            request.checkRepositoryAvailability?.toString() ?? "false",
        },
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  stageFileChanges(request: StageFileChangesApiRequest): Observable<void> {
    return this.http
      .post<void>(this.constructStageFileChangesUri(request), {
        filePaths: request.filePaths,
        stageAll: request.stageAll,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  readRemoteFileContent(
    request: ReadRemoteFileContentApiRequest
  ): Observable<ReadRemoteFileContentApiResponse> {
    return this.http
      .get<ReadRemoteFileContentApiResponse>(
        this.constructRemoteFileUri(request),
        {
          params: {
            filePath: request.filePath,
          },
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getConflictingDiffVersions(
    request: GetConflictingDiffVersionsApiRequest
  ): Observable<GetConflictingDiffVersionsApiResponse> {
    return this.http
      .get<GetConflictingDiffVersionsApiResponse>(
        this.constructGetConflictingDiffVersionsUri(request),
        {
          params: {
            filePath: request.filePath,
            requestedDiffVersions: request.requestedDiffVersions,
          },
        }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  private constructResetChangesUri(request: ResetChangesApiRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/reset`
    );
  }

  private constructCommitChangesUri(request: CommitChangesApiRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/commit-and-push`
    );
  }

  private constructRemoteFileUri(
    request:
      | WriteRemoteFileContentApiRequest
      | DeleteRemoteFileApiRequest
      | ReadRemoteFileContentApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/file`
    );
  }

  private constructRemoteDirectoryUri(
    request: CreateRemoteDirectoryApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/directory`
    );
  }

  private constructRemoteDirectoryDeleteUri(
    request: DeleteRemoteDirectoryApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/directory/delete`
    );
  }

  private constructGetConflictingDiffVersionsUri(
    request: GetConflictingDiffVersionsApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/get-conflicting-diff-versions`
    );
  }

  private constructStageFileChangesUri(request: StageFileChangesApiRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/file/stage`
    );
  }

  private constructStartFunctionalTechnicalUri(
    request: FunctionalTechnicalRebaseApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/functional-technical-rebase`
    );
  }

  private constructSaveFunctionalFixesUri(
    request: SaveBundleChangesApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/mxtest/save-bundle-changes`
    );
  }

  private constructApplyFunctionalFixesUri(
    request: ApplyBundleChangesApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/remote-cloned-repositories/${request.remoteClonedRepositoryId}/operations/mxtest/apply-bundle-changes`
    );
  }

  private constructGetRebaseOperationInfoUri(
    projectId: string,
    remoteClonedRepositoryId: string
  ) {
    return (
      this.apiUrl +
      `projects/${projectId}/remote-cloned-repositories/${remoteClonedRepositoryId}/rebase-info`
    );
  }

  private constructGetRemoteClonedRepositoryStateUri(
    projectId: string,
    remoteClonedRepositoryId: string
  ) {
    return (
      this.apiUrl +
      `projects/${projectId}/remote-cloned-repositories/${remoteClonedRepositoryId}`
    );
  }

  private constructGetConflictingFilesUri(
    projectId: string,
    remoteClonedRepositoryId: string
  ) {
    return (
      this.apiUrl +
      `projects/${projectId}/remote-cloned-repositories/${remoteClonedRepositoryId}/conflicting-files`
    );
  }

  private constructContinueRebaseUri(
    projectId: string,
    remoteClonedRepositoryId: string
  ) {
    return (
      this.apiUrl +
      `projects/${projectId}/remote-cloned-repositories/${remoteClonedRepositoryId}/operations/technical-rebase/resolve-conflicts`
    );
  }

  private constructGetRemoteRepositorySourceTreeUri(
    projectId: string,
    remoteRepositoryId: string
  ) {
    return (
      this.apiUrl +
      `projects/${projectId}/remote-cloned-repositories/${remoteRepositoryId}/source-tree`
    );
  }

  private constructGetChangedFilesUri(
    projectId: string,
    remoteRepositoryId: string
  ) {
    return (
      this.apiUrl +
      `projects/${projectId}/remote-cloned-repositories/${remoteRepositoryId}/changed-files`
    );
  }
}
