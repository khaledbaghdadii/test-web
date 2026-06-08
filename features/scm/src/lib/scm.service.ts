import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";

import { catchError, map, Observable, throwError } from "rxjs";
import { GetBranchDetailsRequest } from "./branch-details/get-branch-details-request";
import { BranchDetailsApiModel } from "./branch-details/branch-details-api-model";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { GetTagDetailsRequest } from "./tag-details/get-tag-details.request";
import { TagDetailsApiModel } from "./tag-details/tag-details.api-model";
import { DescribeRepositoryRequest } from "./describe-repository/describe-repository-request";
import {
  DescribeRepositoryResponse,
  RepoItemType,
  RepositoryItem,
} from "./describe-repository/describe-repository-response";
import {
  DescribeRepositoryApiModel,
  NodeApiModel,
} from "./describe-repository/describe-repository-api-model";
import { DescribeRootNotFoundError } from "./describe-repository/describe-root-not-found-error";
import { GetCommitsDifferenceRequest } from "./commits/get-commits-difference-request";
import { CommitDetails } from "./commits/commit-details";
import {
  DefaultReviewersResponse,
  GetDefaultReviewersRequest,
  GetReviewersRequest,
  ReviewersResponse,
} from "./reviewer/reviewer";
import { FileInfoRequest } from "./file/file-info-request";
import { FileInfo } from "./file/file-info";
import { GetPullRequestApiRequest } from "./pull-request/request/get-pull-request-api-request";
import { GetPaginatedCommitsDifferenceApiRequest } from "./commits/request/get-paginated-commits-difference-api-request";
import { GetPullRequestCommitsPageApiResponse } from "./pull-request/response/get-pull-request-commits-page-api-response";
import { GetPaginatedCommitsDifferencePageApiResponse } from "./commits/response/get-paginated-commits-difference-page-api-response";
import { ErrorHandler } from "./error-handling/error-handler";

@Injectable()
export class ScmService {
  apiUrl: string;

  private handleDescribeRepositoryWithRootFailed = (error: any) =>
    throwError(() => {
      if (ErrorHandler.extractStatus(error) === 404) {
        return new DescribeRootNotFoundError();
      } else {
        return new Error(ErrorHandler.extractMessage(error));
      }
    });

  constructor(@Inject(APP_CONFIG) config: AppConfig, private http: HttpClient) {
    this.apiUrl = config.gatewayUrl + "scm-operations/";
  }

  getBranchDetails(
    request: GetBranchDetailsRequest
  ): Observable<BranchDetailsApiModel> {
    const params = new HttpParams().set("branchName", request.branchName);
    return this.http
      .get<BranchDetailsApiModel>(this.constructBranchDetailsUri(request), {
        params,
      })
      .pipe(
        catchError((error) =>
          throwError(() => ErrorHandler.createErrorWithStatus(error))
        )
      );
  }

  getTagDetails(request: GetTagDetailsRequest): Observable<TagDetailsApiModel> {
    return this.http
      .get<TagDetailsApiModel>(this.constructTagDetailsUri(request))
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getCommitDifferences(
    request: GetCommitsDifferenceRequest
  ): Observable<CommitDetails[]> {
    const params = new HttpParams()
      .set("sourceBranch", request.sourceBranch)
      .set("destinationBranch", request.destinationBranch);
    return this.http
      .get<CommitDetails[]>(this.constructCommitDifferenceUri(request), {
        params,
      })
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getPaginatedCommitDifferences(
    request: GetPaginatedCommitsDifferenceApiRequest
  ): Observable<GetPaginatedCommitsDifferencePageApiResponse> {
    const params = new HttpParams()
      .set("page", String(request.page))
      .set("size", String(request.size))
      .set("source", request.source)
      .set("destination", request.destination);
    return this.http
      .get<GetPaginatedCommitsDifferencePageApiResponse>(
        this.constructPaginatedCommitDifferenceUri(request),
        { params }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  describeRepository(
    request: DescribeRepositoryRequest
  ): Observable<DescribeRepositoryResponse> {
    let params = new HttpParams();
    params = this.setIfPresent(params, "branchName", request.branchName);

    if (request.root) {
      params = params.set("root", request.root);

      return this.http
        .get<DescribeRepositoryApiModel>(
          this.constructDescribeRepositoryUri(request),
          { params }
        )
        .pipe(
          map((value) => this.from(value, request.root)),
          catchError(this.handleDescribeRepositoryWithRootFailed)
        );
    } else {
      return this.http
        .get<DescribeRepositoryApiModel>(
          this.constructDescribeRepositoryUri(request),
          { params }
        )
        .pipe(
          map((value) => this.from(value)),
          catchError((error) =>
            throwError(() => new Error(ErrorHandler.extractMessage(error)))
          )
        );
    }
  }

  getDefaultReviewers(
    request: GetDefaultReviewersRequest
  ): Observable<DefaultReviewersResponse> {
    const params = new HttpParams()
      .set("sourceBranch", request.sourceBranch)
      .set("targetBranch", request.targetBranch);
    return this.http
      .get<DefaultReviewersResponse>(
        this.constructGetDefaultReviewersUri(request),
        { params }
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getReviewers(request: GetReviewersRequest): Observable<ReviewersResponse> {
    return this.http
      .get<ReviewersResponse>(this.constructGetReviewersUri(request))
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getFileInfo(request: FileInfoRequest): Observable<FileInfo> {
    return this.http
      .get<FileInfo>(this.constructGetFileInfoUri(request))
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  getPullRequestCommits(
    request: GetPullRequestApiRequest
  ): Observable<GetPullRequestCommitsPageApiResponse> {
    return this.http
      .get<GetPullRequestCommitsPageApiResponse>(
        this.constructGetPullRequestUri(request) +
          "/commits?page=" +
          request.page +
          "&size=" +
          request.size
      )
      .pipe(
        catchError((error) =>
          throwError(() => new Error(ErrorHandler.extractMessage(error)))
        )
      );
  }

  private from(
    value: DescribeRepositoryApiModel,
    root = ""
  ): DescribeRepositoryResponse {
    return {
      repositoryItems: this.fromNodes(value.nodes, root),
    } as DescribeRepositoryResponse;
  }

  private fromNodes(
    nodes: NodeApiModel[] | undefined,
    parentPath: string
  ): RepositoryItem[] {
    if (nodes) {
      return this.mapNodes(nodes, parentPath);
    } else {
      return [];
    }
  }

  private mapNodes(
    nodes: NodeApiModel[],
    parentPath: string
  ): RepositoryItem[] {
    return nodes.map((node) => {
      if (node.isDirectory) {
        return {
          parentPath: parentPath,
          name: node.name,
          children: this.fromNodes(
            node.children,
            this.resolveParentPath(node, parentPath)
          ),
          type: RepoItemType.DIRECTORY,
        };
      } else {
        return {
          parentPath: parentPath,
          name: node.name,
          type: RepoItemType.FILE,
        };
      }
    });
  }

  private resolveParentPath(node: NodeApiModel, parentPath: string) {
    return parentPath ? `${parentPath}/${node.name}` : node.name;
  }

  private constructBranchDetailsUri(request: GetBranchDetailsRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repoId}/branches`
    );
  }

  private constructTagDetailsUri(request: GetTagDetailsRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/tags/${request.name}`
    );
  }

  private constructCommitDifferenceUri(request: GetCommitsDifferenceRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/commits/difference`
    );
  }

  private constructPaginatedCommitDifferenceUri(
    request: GetPaginatedCommitsDifferenceApiRequest
  ) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/commits/diff`
    );
  }

  private constructDescribeRepositoryUri(request: DescribeRepositoryRequest) {
    return `${this.apiUrl}projects/${request.projectId}/repositories/${request.repositoryId}/directories/tree/branch`;
  }

  private constructGetDefaultReviewersUri(request: GetDefaultReviewersRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/default-reviewers`
    );
  }

  private constructGetReviewersUri(request: GetReviewersRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/reviewers?page=${request.page}&size=${request.size}&filter=${request.filter}`
    );
  }

  private constructGetFileInfoUri(request: FileInfoRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/files/version/${request.version}/info?path=${request.path}`
    );
  }

  private constructGetPullRequestUri(request: GetPullRequestApiRequest) {
    return (
      this.apiUrl +
      `projects/${request.projectId}/repositories/${request.repositoryId}/pull-requests/${request.pullRequestId}`
    );
  }

  private setIfPresent(
    params: HttpParams,
    key: string,
    value?: string | number | boolean
  ): HttpParams {
    if (value === undefined || value === null || value === "") return params;
    return params.set(key, String(value));
  }
}
