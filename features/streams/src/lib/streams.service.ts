import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import {
  catchError,
  concatAll,
  concatMap,
  distinct,
  map,
  Observable,
  throwError,
  toArray,
} from "rxjs";
import { BusinessProcessChain } from "./business-process-chain";
import { Stream } from "./stream";
import { BusinessProcessChainApiModel } from "./api-models/business-process-chain-api-model";
import { APP_CONFIG, AppConfig } from "@mxflow/config";
import { EditStreamApiRequest } from "./api-models/edit-stream/edit-stream-api-request";
import { CreateStreamApiRequest } from "./api-models/create-stream/create-stream-api-request";
import { StreamsApiModel } from "./api-models/streams-api-model";

@Injectable()
export class StreamsService {
  apiUrl: string;

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private http: HttpClient
  ) {
    this.apiUrl = config.gatewayUrl + "projects/";
  }

  private static toBusinessProcessChains(
    bpcApiModels: BusinessProcessChainApiModel[]
  ) {
    return bpcApiModels.map((apiModel) => {
      return {
        id: apiModel.id,
        name: apiModel.name,
      };
    });
  }

  private static toStreams(streamApiModels: StreamsApiModel[]) {
    return streamApiModels.map(StreamsService.toStream);
  }

  private static toStream(stream: StreamsApiModel) {
    return {
      id: stream.id,
      name: stream.name,
      owners: stream.owners,
      businessProcessChains: stream.businessProcessChains,
    };
  }

  private constructBaseStreamsUri(projectId: string) {
    return this.apiUrl + projectId + "/streams";
  }

  createStream(
    projectId: string,
    createStream: CreateStreamApiRequest
  ): Observable<Stream> {
    return this.http
      .post<StreamsApiModel>(
        this.constructBaseStreamsUri(projectId),
        createStream
      )
      .pipe(
        map(StreamsService.toStream),
        catchError((error) => throwError(() => new Error(error.error)))
      );
  }

  editStream(
    streamApiRequest: EditStreamApiRequest,
    streamId: string,
    projectId: string
  ): Observable<Stream> {
    return this.http
      .put<Stream>(
        this.constructBaseStreamsUri(projectId) + `/${streamId}`,
        streamApiRequest
      )
      .pipe(catchError((error) => throwError(() => new Error(error.error))));
  }

  getListOfBpcs(): Observable<BusinessProcessChain[]> {
    return this.http
      .get<BusinessProcessChainApiModel[]>(this.apiUrl + "bpc")
      .pipe(
        map(StreamsService.toBusinessProcessChains),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  getStreams(projectId: string): Observable<Stream[]> {
    return this.http
      .get<StreamsApiModel[]>(this.constructBaseStreamsUri(projectId))
      .pipe(
        map(StreamsService.toStreams),
        catchError((error) => throwError(() => new Error(error.message)))
      );
  }

  getListOfBpcsByProjectId(
    projectId: string
  ): Observable<BusinessProcessChain[]> {
    return this.getStreams(projectId).pipe(
      concatMap((streams) =>
        streams.map((stream) => stream.businessProcessChains)
      ),
      concatAll(),
      distinct((bpc) => bpc.id),
      toArray()
    );
  }
}
