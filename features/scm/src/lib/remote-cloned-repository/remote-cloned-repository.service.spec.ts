import { RemoteClonedRepositoryService } from "./remote-cloned-repository.service";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, of, throwError } from "rxjs";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { TestBed } from "@angular/core/testing";
import { FunctionalTechnicalRebaseApiRequest } from "./request/functional-technical-rebase-api-request";
import { SaveBundleChangesApiRequest } from "./request/save-bundle-changes-api-request";
import { ApplyBundleChangesApiRequest } from "./request/apply-bundle-changes-api-request";
import { CommitChangesApiRequest } from "./request/commit-changes-api-request";
import { ResetChangesApiRequest } from "./request/reset-changes-api-request";
import { StageFileChangesApiRequest } from "./request/stage-file-changes-api-request";
import {
  RebaseState,
  GetRebaseOperationInfoApiResponse,
} from "./response/get-rebase-operation-info-api-response";
import {
  RemoteClonedRepositoryOperationApiResponse,
  RemoteClonedRepositoryOperationStatus,
  RemoteClonedRepositoryOperationType,
} from "./response/remote-cloned-repository-operation-api-response";
import { GitFileStatusCode } from "./model";
import { ReadRemoteFileContentApiRequest } from "./request/read-remote-file-content-api-request";
import { GetConflictingDiffVersionsApiRequest } from "./request/get-conflicting-diff-versions-api-request";
import { DiffVersion } from "./model/diff-version.enum";
import { GetConflictingDiffVersionsApiResponse } from "./response/get-conflicting-diff-versions-api-response";
import { ReadRemoteFileContentApiResponse } from "./response/read-remote-file-content-api-response";
import { SourceTreeEntryApiResponse } from "./response/source-tree-entry-api-response";
import { DeleteRemoteFileApiRequest } from "./request/delete-remote-file-api-request";
import { WriteRemoteFileContentApiRequest } from "./request/write-remote-file-content-api-request";
import { CreateRemoteDirectoryApiRequest } from "./request/create-remote-directory-api-request";
import { DeleteRemoteDirectoryApiRequest } from "./request/delete-remote-directory-api-request";
import {
  RemoteClonedRepositoryState,
  RemoteClonedRepositoryStateApiResponse,
} from "./response/get-remote-cloned-repository-state-api-response";

describe("Service: RemoteClonedRepositoryService", () => {
  const GATEWAY_URL = "https://gateway.cd.murex.com/api/v1/";
  const PROJECT_ID = "projectId";
  const REMOTE_REPOSITORY_ID = "remoteClonedRepositoryId";
  const ERROR_MESSAGE = "error";

  const appConfig: AppConfig = {
    gatewayUrl: GATEWAY_URL,
  } as unknown as AppConfig;

  let service: RemoteClonedRepositoryService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    } as unknown as HttpClient;

    TestBed.configureTestingModule({
      providers: [
        RemoteClonedRepositoryService,
        { provide: APP_CONFIG, useValue: appConfig },
        { provide: HttpClient, useValue: httpClient },
      ],
    });

    service = TestBed.inject(RemoteClonedRepositoryService);
  });

  describe("startRemoteClonedRepositoryFunctionalTechnicalRebase", () => {
    it("should start functional technical rebase", async () => {
      const request: FunctionalTechnicalRebaseApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        payload: {
          sourceBranchName: "source-branch",
          targetBranchName: "target-branch",
        },
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(
        service.startRemoteClonedRepositoryFunctionalTechnicalRebase(request)
      );

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/functional-technical-rebase`,
        request.payload
      );
    });

    it("should throw an error on failure to start functional technical rebase", async () => {
      const request: FunctionalTechnicalRebaseApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        payload: {
          sourceBranchName: "source-branch",
          targetBranchName: "target-branch",
        },
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(
          service.startRemoteClonedRepositoryFunctionalTechnicalRebase(request)
        )
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/functional-technical-rebase`,
        request.payload
      );
    });
  });

  describe("saveBundleChanges", () => {
    it("should save bundle changes", async () => {
      const request: SaveBundleChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        payload: {
          content: "bundle content",
        },
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.saveBundleChanges(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/mxtest/save-bundle-changes`,
        request.payload
      );
    });

    it("should throw an error on failure to save bundle changes", async () => {
      const request: SaveBundleChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        payload: {
          content: "bundle content",
        },
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.saveBundleChanges(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/mxtest/save-bundle-changes`,
        request.payload
      );
    });
  });

  describe("applyFunctionalFixes", () => {
    it("should apply functional fixes", async () => {
      const request: ApplyBundleChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.applyFunctionalFixes(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/mxtest/apply-bundle-changes`,
        null
      );
    });

    it("should throw an error on failure to apply functional fixes", async () => {
      const request: ApplyBundleChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.applyFunctionalFixes(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/mxtest/apply-bundle-changes`,
        null
      );
    });
  });

  describe("continueRebase", () => {
    it("should continue rebase", async () => {
      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(
        service.continueRebase(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/technical-rebase/resolve-conflicts`,
        null
      );
    });

    it("should throw an error on failure to continue rebase", async () => {
      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.continueRebase(PROJECT_ID, REMOTE_REPOSITORY_ID))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/technical-rebase/resolve-conflicts`,
        null
      );
    });
  });

  describe("getRebaseOperationInfo", () => {
    it("should get rebase operation info", async () => {
      const operation1: RemoteClonedRepositoryOperationApiResponse = {
        id: "op-1",
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        type: RemoteClonedRepositoryOperationType.CLONE_AND_SYNC,
        endedOn: "2026-01-01T00:00:00Z",
        status: RemoteClonedRepositoryOperationStatus.SUCCEEDED,
      };
      const operation2: RemoteClonedRepositoryOperationApiResponse = {
        id: "op-2",
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        type: RemoteClonedRepositoryOperationType.REBASE,
        status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
      };
      const response: GetRebaseOperationInfoApiResponse = {
        rebaseInProgress: true,
        rebaseOperations: [operation1, operation2],
        sourceBranchName: "source-branch",
        targetBranchName: "target-branch",
        rebaseState: RebaseState.TECHNICAL_REBASE_IN_PROGRESS,
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getRebaseOperationInfo(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/rebase-info`
      );
    });

    it("should throw an error on failure to get rebase operation info", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(
          service.getRebaseOperationInfo(PROJECT_ID, REMOTE_REPOSITORY_ID)
        )
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/rebase-info`
      );
    });

    it("should get rebase operation info with empty operations", async () => {
      const response: GetRebaseOperationInfoApiResponse = {
        rebaseInProgress: false,
        rebaseOperations: [],
        sourceBranchName: "source-branch",
        targetBranchName: "target-branch",
        rebaseState: RebaseState.MXTEST_FUNCTIONAL_REBASE_IN_PROGRESS,
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getRebaseOperationInfo(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual(response);
      expect(data.rebaseOperations).toHaveLength(0);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/rebase-info`
      );
    });

    it("should get remote cloned repository state including conflicting files", async () => {
      const operation: RemoteClonedRepositoryOperationApiResponse = {
        id: "op-1",
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        type: RemoteClonedRepositoryOperationType.REBASE,
        status: RemoteClonedRepositoryOperationStatus.IN_PROGRESS,
      };

      const response: GetRebaseOperationInfoApiResponse = {
        rebaseInProgress: true,
        rebaseOperations: [operation],
        sourceBranchName: "source-branch",
        targetBranchName: "target-branch",
        rebaseState: RebaseState.TECHNICAL_REBASE_IN_CONFLICT,
        conflictingFiles: [
          {
            filePath: "src/app/main.ts",
            newFilePath: "src/app/main-renamed.ts",
            workspaceFileByteSize: 120,
            baseFileByteSize: 100,
            localFileByteSize: 110,
            remoteFileByteSize: 115,
            gitFileStatusCode: GitFileStatusCode.BOTH_MODIFIED,
          },
          {
            filePath: "src/deleted-file.txt",
            workspaceFileByteSize: 0,
            baseFileByteSize: 0,
            localFileByteSize: 0,
            remoteFileByteSize: 0,
            gitFileStatusCode: GitFileStatusCode.WORKTREE_DELETED,
          },
        ],
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getRebaseOperationInfo(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual(response);
      expect(data.conflictingFiles).toBeDefined();
      expect(data.conflictingFiles).toHaveLength(2);
      expect(data.conflictingFiles?.[0].filePath).toBe("src/app/main.ts");
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/rebase-info`
      );
    });
  });

  describe("getRemoteClonedRepositoryState", () => {
    it("should get remote cloned repository state", async () => {
      const response: RemoteClonedRepositoryStateApiResponse = {
        remoteClonedRepositoryState: RemoteClonedRepositoryState.AVAILABLE,
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getRemoteClonedRepositoryState(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}`
      );
    });

    it("should throw an error on failure to get remote cloned repository state", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(
          service.getRemoteClonedRepositoryState(
            PROJECT_ID,
            REMOTE_REPOSITORY_ID
          )
        )
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}`
      );
    });
  });

  describe("commitChanges", () => {
    it("should commit changes", async () => {
      const request: CommitChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        branchName: "main",
        commitMessage: "commit message",
        fileAndDirectoryPathsToCommit: ["path/to/file1", "path/to/file2"],
        commitAuthorDetails: {
          username: "testuser",
          email: "testuser@example.com",
        },
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.commitChanges(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/commit-and-push`,
        {
          branchName: request.branchName,
          filesToCommit: request.fileAndDirectoryPathsToCommit,
          commitMessage: request.commitMessage,
          commitAuthorDetails: request.commitAuthorDetails,
        }
      );
    });

    it("should throw an error on failure to commit changes", async () => {
      const request: CommitChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        branchName: "main",
        commitMessage: "commit message",
        fileAndDirectoryPathsToCommit: ["path/to/file1"],
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.commitChanges(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/commit-and-push`,
        {
          branchName: request.branchName,
          filesToCommit: request.fileAndDirectoryPathsToCommit,
          commitMessage: request.commitMessage,
        }
      );
    });
  });

  describe("getRemoteRepositorySourceTree", () => {
    it("should get remote repository source tree with optional query params", async () => {
      const response: SourceTreeEntryApiResponse[] = [
        {
          path: "src/app/main.ts",
          pathCode: GitFileStatusCode.WORKTREE_MODIFIED,
          pathSize: 128,
          directory: false,
        },
      ];

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getRemoteRepositorySourceTree(
          PROJECT_ID,
          REMOTE_REPOSITORY_ID,
          "src/app",
          1,
          2
        )
      );

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledTimes(1);

      const getCall = (httpClient.get as jest.Mock).mock.calls[0];
      expect(getCall[0]).toBe(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/source-tree`
      );
      expect(getCall[1].params.get("subDirectoryPath")).toBe("src/app");
      expect(getCall[1].params.get("minDepth")).toBe("1");
      expect(getCall[1].params.get("maxDepth")).toBe("2");
    });

    it("should get remote repository source tree without optional query params", async () => {
      const response: SourceTreeEntryApiResponse[] = [];

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getRemoteRepositorySourceTree(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledTimes(1);

      const getCall = (httpClient.get as jest.Mock).mock.calls[0];
      expect(getCall[0]).toBe(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/source-tree`
      );
      expect(getCall[1].params.keys()).toEqual([]);
    });

    it("should throw an error on failure to get remote repository source tree", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(
          service.getRemoteRepositorySourceTree(
            PROJECT_ID,
            REMOTE_REPOSITORY_ID,
            "src",
            0,
            3
          )
        )
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      const getCall = (httpClient.get as jest.Mock).mock.calls[0];
      expect(getCall[0]).toBe(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/source-tree`
      );
      expect(getCall[1].params.get("subDirectoryPath")).toBe("src");
      expect(getCall[1].params.get("minDepth")).toBe("0");
      expect(getCall[1].params.get("maxDepth")).toBe("3");
    });
  });

  describe("getChangedFiles", () => {
    it("should get changed files", async () => {
      const response = [
        {
          path: "src/app/main.ts",
          gitFileStatusCode: GitFileStatusCode.WORKTREE_MODIFIED,
        },
        {
          path: "src/app/new-file.ts",
          gitFileStatusCode: GitFileStatusCode.INDEX_ADDED,
        },
      ];

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getChangedFiles(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/changed-files`
      );
    });

    it("should return empty array when no changed files", async () => {
      jest.spyOn(httpClient, "get").mockReturnValue(of([]));

      const data = await firstValueFrom(
        service.getChangedFiles(PROJECT_ID, REMOTE_REPOSITORY_ID)
      );

      expect(data).toEqual([]);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/changed-files`
      );
    });

    it("should throw an error on failure to get changed files", async () => {
      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(
          service.getChangedFiles(PROJECT_ID, REMOTE_REPOSITORY_ID)
        )
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/changed-files`
      );
    });
  });

  describe("resetChanges", () => {
    it("should reset changes", async () => {
      const request: ResetChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        fileAndDirectoryPathsToReset: ["path/to/file1", "path/to/file2"],
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.resetChanges(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/reset`,
        {
          paths: request.fileAndDirectoryPathsToReset,
        }
      );
    });

    it("should throw an error on failure to reset changes", async () => {
      const request: ResetChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        fileAndDirectoryPathsToReset: ["path/to/file1"],
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.resetChanges(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/reset`,
        {
          paths: request.fileAndDirectoryPathsToReset,
        }
      );
    });
  });

  describe("writeRemoteFileContent", () => {
    it("should write remote file content", async () => {
      const request: WriteRemoteFileContentApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: "path/to/file.txt",
        fileContent: "file content",
        checkRepositoryAvailability: true,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(
        service.writeRemoteFileContent(request)
      );

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file`,
        {
          filePath: request.filePath,
          fileContent: request.fileContent,
          checkRepositoryAvailability: request.checkRepositoryAvailability,
        }
      );
    });

    it("should throw an error on failure to write remote file content", async () => {
      const request: WriteRemoteFileContentApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: "path/to/file.txt",
        fileContent: "file content",
        checkRepositoryAvailability: true,
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.writeRemoteFileContent(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file`,
        {
          filePath: request.filePath,
          fileContent: request.fileContent,
          checkRepositoryAvailability: request.checkRepositoryAvailability,
        }
      );
    });
  });

  describe("deleteRemoteFile", () => {
    it("should delete remote file", async () => {
      const request: DeleteRemoteFileApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: "path/to/file.txt",
        checkRepositoryAvailability: true,
      };

      jest.spyOn(httpClient, "delete").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.deleteRemoteFile(request));

      expect(data).toBeUndefined();
      expect(httpClient.delete).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file`,
        {
          params: {
            filePath: request.filePath,
            checkRepositoryAvailability: "true",
          },
        }
      );
    });

    it("should throw an error on failure to delete remote file", async () => {
      const request: DeleteRemoteFileApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: "path/to/file.txt",
        checkRepositoryAvailability: true,
      };

      jest
        .spyOn(httpClient, "delete")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.deleteRemoteFile(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.delete).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file`,
        {
          params: {
            filePath: request.filePath,
            checkRepositoryAvailability: "true",
          },
        }
      );
    });
  });

  describe("stageFileChanges", () => {
    it("should stage file changes", async () => {
      const request: StageFileChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePaths: ["path/to/file.txt"],
        stageAll: false,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.stageFileChanges(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file/stage`,
        {
          filePaths: request.filePaths,
          stageAll: request.stageAll,
        }
      );
    });

    it("should throw an error on failure to stage file changes", async () => {
      const request: StageFileChangesApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePaths: ["path/to/file.txt"],
        stageAll: false,
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.stageFileChanges(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file/stage`,
        {
          filePaths: request.filePaths,
          stageAll: request.stageAll,
        }
      );
    });
  });

  describe("readRemoteFileContent", () => {
    const FILE_PATH = "path/to/file.txt";
    const FILE_CONTENT = "file content";

    it("should read remote file content", async () => {
      const request: ReadRemoteFileContentApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: FILE_PATH,
      };
      const response: ReadRemoteFileContentApiResponse = {
        payload: FILE_CONTENT,
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(service.readRemoteFileContent(request));

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file`,
        { params: { filePath: FILE_PATH } }
      );
    });

    it("should throw an error on failure to read remote file content", async () => {
      const request: ReadRemoteFileContentApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: FILE_PATH,
      };

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.readRemoteFileContent(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/file`,
        { params: { filePath: FILE_PATH } }
      );
    });
  });

  describe("getConflictingDiffVersions", () => {
    const FILE_PATH = "path/to/file.yaml";
    const REQUESTED_VERSIONS = [
      DiffVersion.BASE,
      DiffVersion.LOCAL,
      DiffVersion.REMOTE,
    ];

    it("should get conflicting diff versions", async () => {
      const request: GetConflictingDiffVersionsApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: FILE_PATH,
        requestedDiffVersions: REQUESTED_VERSIONS,
      };
      const response: GetConflictingDiffVersionsApiResponse = {
        versionContents: {
          [DiffVersion.BASE]: "base content",
          [DiffVersion.LOCAL]: "local content",
          [DiffVersion.REMOTE]: "remote content",
        },
      };

      jest.spyOn(httpClient, "get").mockReturnValue(of(response));

      const data = await firstValueFrom(
        service.getConflictingDiffVersions(request)
      );

      expect(data).toEqual(response);
      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/get-conflicting-diff-versions`,
        {
          params: {
            filePath: FILE_PATH,
            requestedDiffVersions: REQUESTED_VERSIONS,
          },
        }
      );
    });

    it("should throw an error on failure to get conflicting diff versions", async () => {
      const request: GetConflictingDiffVersionsApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        filePath: FILE_PATH,
        requestedDiffVersions: REQUESTED_VERSIONS,
      };

      jest
        .spyOn(httpClient, "get")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.getConflictingDiffVersions(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.get).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/get-conflicting-diff-versions`,
        {
          params: {
            filePath: FILE_PATH,
            requestedDiffVersions: REQUESTED_VERSIONS,
          },
        }
      );
    });
  });

  describe("createRemoteDirectory", () => {
    it("should create remote directory", async () => {
      const request: CreateRemoteDirectoryApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        directoryPath: "path/to/newdir",
        checkRepositoryAvailability: false,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.createRemoteDirectory(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/directory`,
        {
          directoryPath: request.directoryPath,
          checkRepositoryAvailability: request.checkRepositoryAvailability,
        }
      );
    });

    it("should throw an error on failure to create remote directory", async () => {
      const request: CreateRemoteDirectoryApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        directoryPath: "path/to/newdir",
        checkRepositoryAvailability: false,
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.createRemoteDirectory(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/directory`,
        {
          directoryPath: request.directoryPath,
          checkRepositoryAvailability: request.checkRepositoryAvailability,
        }
      );
    });
  });

  describe("deleteRemoteDirectory", () => {
    it("should delete remote directory", async () => {
      const request: DeleteRemoteDirectoryApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        directoryPath: "path/to/dir",
        checkRepositoryAvailability: false,
      };

      jest.spyOn(httpClient, "post").mockReturnValue(of(undefined));

      const data = await firstValueFrom(service.deleteRemoteDirectory(request));

      expect(data).toBeUndefined();
      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/directory/delete`,
        {
          directoryPath: request.directoryPath,
          checkRepositoryAvailability: request.checkRepositoryAvailability,
        }
      );
    });

    it("should throw an error on failure to delete remote directory", async () => {
      const request: DeleteRemoteDirectoryApiRequest = {
        projectId: PROJECT_ID,
        remoteClonedRepositoryId: REMOTE_REPOSITORY_ID,
        directoryPath: "path/to/dir",
        checkRepositoryAvailability: false,
      };

      jest
        .spyOn(httpClient, "post")
        .mockReturnValue(
          throwError(() => ({ error: { message: ERROR_MESSAGE } }))
        );

      await expect(
        firstValueFrom(service.deleteRemoteDirectory(request))
      ).rejects.toMatchObject({ message: ERROR_MESSAGE });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${GATEWAY_URL}scm-operations/projects/${PROJECT_ID}/remote-cloned-repositories/${REMOTE_REPOSITORY_ID}/operations/directory/delete`,
        {
          directoryPath: request.directoryPath,
          checkRepositoryAvailability: request.checkRepositoryAvailability,
        }
      );
    });
  });
});
