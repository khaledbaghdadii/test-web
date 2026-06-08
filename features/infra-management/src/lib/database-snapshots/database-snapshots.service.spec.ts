import {
  DatabaseInstance,
  DatabaseSnapshot,
  DatabaseSnapshotErpAllocation,
  DatabaseSnapshotPage,
  Dump,
  FetchDatabaseSnapshotsFilter,
} from "./model/database-snapshot";
import { DatabaseSnapshotService } from "./database-snapshots.service";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { APP_CONFIG } from "@mxflow/config";
import { DatabaseSnapshotSource } from "./model/database-snapshot-source";
import {
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { firstValueFrom } from "rxjs";

const MOCK_GATEWAY_URL = "https://mock-gateway-url.com";
const MOCK_DATABASE_SNAPSHOT_ID = "1";
const MOCK_DATABASE_SNAPSHOT_ID_2 = "2";
const MOCK_PROJECT_ID = "1";
const MOCK_PLUGIN = "plugin1";
const MOCK_EXTERNAL_ID = "externalId1";
const MOCK_EXTERNAL_ID_2 = "externalId2";
const MOCK_DATABASE_SNAPSHOT_TYPE = "oracle";
const MOCK_DATABASE_SNAPSHOT_STATE = "AVAILABLE";
const MOCK_DATABASE_SNAPSHOT_SOURCE_DUMPS = "dumps";
const MOCK_DATABASE_SNAPSHOT_SOURCE_DATABASE_INSTANCE = "database_instance";
const MOCK_CREATED_ON = new Date();
const MOCK_CREATED_BY = "user1";
const MOCK_DUMP_ID = "1";
const MOCK_DATABASE_INSTANCE_ID = "1";
const MOCK_DATABASE_INSTANCE_NAME = "database_instance_name";
const PROJECT_ID = "project-id";
const PROJECT_ID_2 = "project-id2";
const MOCK_PAGE_INDEX = 0;
const MOCK_PAGE_SIZE = 10;
const MOCK_CREATE_DATABASE_SNAPSHOT_REQUEST_ID =
  "createDatabaseSnapshotRequestId";
const MOCK_SERVER_VERSION = "serverVersion";
const MOCK_SERVER_SP_VERSION = "serverSpVersion";
const MOCK_ERP_PROJECT_ID = "erpProjectId";
const MOCK_ERP_ALLOCATION_NAME = "erpAllocationName";
const MOCK_ERP_ALLOCATION_ID = "erp-allocation-id";

const MOCK_ERP_ALLOCATION: DatabaseSnapshotErpAllocation = {
  erpProjectId: MOCK_ERP_PROJECT_ID,
  erpAllocationName: MOCK_ERP_ALLOCATION_NAME,
};

const MOCK_DUMP: Dump = {
  id: MOCK_DUMP_ID,
};

const MOCK_DATABASE_INSTANCE: DatabaseInstance = {
  id: MOCK_DATABASE_INSTANCE_ID,
  instanceName: MOCK_DATABASE_INSTANCE_NAME,
};

const MOCK_DATABASE_SNAPSHOT_FROM_DUMPS: DatabaseSnapshot = {
  id: MOCK_DATABASE_SNAPSHOT_ID,
  projectId: MOCK_PROJECT_ID,
  plugin: MOCK_PLUGIN,
  externalId: MOCK_EXTERNAL_ID,
  databaseSnapshotType: MOCK_DATABASE_SNAPSHOT_TYPE,
  databaseSnapshotState: MOCK_DATABASE_SNAPSHOT_STATE,
  databaseSnapshotSource: MOCK_DATABASE_SNAPSHOT_SOURCE_DUMPS,
  erpAllocation: MOCK_ERP_ALLOCATION,
  dumps: [MOCK_DUMP],
  createdOn: MOCK_CREATED_ON,
  createdBy: MOCK_CREATED_BY,
};

const MOCK_DATABASE_SNAPSHOT_FROM_DATABASE_INSTANCE: DatabaseSnapshot = {
  id: MOCK_DATABASE_SNAPSHOT_ID_2,
  projectId: MOCK_PROJECT_ID,
  plugin: MOCK_PLUGIN,
  externalId: MOCK_EXTERNAL_ID_2,
  databaseSnapshotType: MOCK_DATABASE_SNAPSHOT_TYPE,
  databaseSnapshotState: MOCK_DATABASE_SNAPSHOT_STATE,
  databaseSnapshotSource: MOCK_DATABASE_SNAPSHOT_SOURCE_DATABASE_INSTANCE,
  databaseInstance: MOCK_DATABASE_INSTANCE,
  erpAllocation: MOCK_ERP_ALLOCATION,
  createdOn: MOCK_CREATED_ON,
  createdBy: MOCK_CREATED_BY,
};

const MOCK_DATABASE_SNAPSHOT_PAGE: DatabaseSnapshotPage = {
  content: [
    MOCK_DATABASE_SNAPSHOT_FROM_DUMPS,
    MOCK_DATABASE_SNAPSHOT_FROM_DATABASE_INSTANCE,
  ],
  totalPages: 1,
  totalElements: 2,
  size: MOCK_PAGE_SIZE,
  number: MOCK_PAGE_INDEX,
  last: true,
};

const MOCK_SEARCH_KEY = "search-key";
const MOCK_DATABASE_SNAPSHOT_SOURCE = "source";
const MOCK_SOURCE_DATABASE_INSTANCE_NAME_SEARCH_KEY = "source-db-instance-name";
const MOCK_EXTERNAL_ID_SEARCH_KEY = "external-id";
const MOCK_PLUGIN_SEARCH_KEY = "plugin-search-key";

const MOCK_FETCH_DATABASE_SNAPSHOTS_FILTER: FetchDatabaseSnapshotsFilter = {
  pageIndex: MOCK_PAGE_INDEX,
  pageSize: MOCK_PAGE_SIZE,
  projectIds: [PROJECT_ID, PROJECT_ID_2],
  searchKey: MOCK_SEARCH_KEY,
  databaseSnapshotSource: MOCK_DATABASE_SNAPSHOT_SOURCE,
  databaseSnapshotTypes: [MOCK_DATABASE_SNAPSHOT_TYPE],
  databaseSnapshotStates: [MOCK_DATABASE_SNAPSHOT_STATE],
  sourceDatabaseInstanceNameSearchKey:
    MOCK_SOURCE_DATABASE_INSTANCE_NAME_SEARCH_KEY,
  pluginSearchKey: MOCK_PLUGIN_SEARCH_KEY,
  externalIdSearchKey: MOCK_EXTERNAL_ID_SEARCH_KEY,
};

const MOCK_CREATE_DATABASE_SNAPSHOT_RESPONSE = {
  id: MOCK_CREATE_DATABASE_SNAPSHOT_REQUEST_ID,
};

const MOCK_CREATE_DATABASE_SNAPSHOT_FROM_DUMPS_REQUEST = {
  dumpIds: [MOCK_DUMP_ID],
  serverVersion: MOCK_SERVER_VERSION,
  serverSpVersion: MOCK_SERVER_SP_VERSION,
  databaseSnapshotSource: DatabaseSnapshotSource.DUMPS,
  erpAllocationId: MOCK_ERP_ALLOCATION_ID,
};

describe("DatabaseSnapshotService", () => {
  let service: DatabaseSnapshotService;
  let httpMock: HttpTestingController;
  const mockAppConfig = {
    gatewayUrl: MOCK_GATEWAY_URL,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DatabaseSnapshotService,
        { provide: APP_CONFIG, useValue: mockAppConfig },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DatabaseSnapshotService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getAllDatabaseSnapshots and return a DatabaseSnapshotPage", async () => {
    const configPromise = firstValueFrom(
      service.getAllDatabaseSnapshots(MOCK_FETCH_DATABASE_SNAPSHOTS_FILTER)
    );

    const req = httpMock.expectOne(
      {
        method: "GET",
        url: `${MOCK_GATEWAY_URL}infra/management/database-snapshots?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&searchKey=${MOCK_SEARCH_KEY}&databaseSnapshotSource=${MOCK_DATABASE_SNAPSHOT_SOURCE}&sourceDatabaseInstanceNameSearch=${MOCK_SOURCE_DATABASE_INSTANCE_NAME_SEARCH_KEY}&pluginSearch=${MOCK_PLUGIN_SEARCH_KEY}&externalIdSearch=${MOCK_EXTERNAL_ID_SEARCH_KEY}&projectIds=${PROJECT_ID}&projectIds=${PROJECT_ID_2}&databaseSnapshotTypes=${MOCK_DATABASE_SNAPSHOT_TYPE}&databaseSnapshotStates=${MOCK_DATABASE_SNAPSHOT_STATE}`,
      },
      "Request to get all database snapshots"
    );

    req.flush(MOCK_DATABASE_SNAPSHOT_PAGE);

    await expect(configPromise).resolves.toEqual(MOCK_DATABASE_SNAPSHOT_PAGE);
  });

  it("should handle errors from getAllDatabaseSnapshots", async () => {
    const configPromise = firstValueFrom(
      service.getAllDatabaseSnapshots(MOCK_FETCH_DATABASE_SNAPSHOTS_FILTER)
    );

    const req = httpMock.expectOne(
      {
        method: "GET",
        url: `${MOCK_GATEWAY_URL}infra/management/database-snapshots?page=${MOCK_PAGE_INDEX}&size=${MOCK_PAGE_SIZE}&sort=createdOn,desc&searchKey=${MOCK_SEARCH_KEY}&databaseSnapshotSource=${MOCK_DATABASE_SNAPSHOT_SOURCE}&sourceDatabaseInstanceNameSearch=${MOCK_SOURCE_DATABASE_INSTANCE_NAME_SEARCH_KEY}&pluginSearch=${MOCK_PLUGIN_SEARCH_KEY}&externalIdSearch=${MOCK_EXTERNAL_ID_SEARCH_KEY}&projectIds=${PROJECT_ID}&projectIds=${PROJECT_ID_2}&databaseSnapshotTypes=${MOCK_DATABASE_SNAPSHOT_TYPE}&databaseSnapshotStates=${MOCK_DATABASE_SNAPSHOT_STATE}`,
      },
      "Request to get all database snapshots"
    );

    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });

    await expect(configPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    await expect(configPromise).rejects.toMatchObject({
      status: 500,
      statusText: "Server Error",
    });
    await expect(configPromise).rejects.toHaveProperty(
      "error",
      "Something went wrong"
    );
  });

  it("should call createDatabaseSnapshotFromDumps and return a CreateDatabaseSnapshotResponse", async () => {
    const configPromise = firstValueFrom(
      service.createDatabaseSnapshotFromDumps(
        MOCK_PROJECT_ID,
        MOCK_CREATE_DATABASE_SNAPSHOT_FROM_DUMPS_REQUEST
      )
    );

    const req = httpMock.expectOne(
      {
        method: "POST",
        url: `${MOCK_GATEWAY_URL}projects/${MOCK_PROJECT_ID}/infra/management/database-snapshots`,
      },
      "Request to create database snapshot from dumps"
    );

    req.flush(MOCK_CREATE_DATABASE_SNAPSHOT_RESPONSE);

    await expect(configPromise).resolves.toEqual(
      MOCK_CREATE_DATABASE_SNAPSHOT_RESPONSE
    );
  });

  it("should handle errors from createDatabaseSnapshotFromDumps", async () => {
    const configPromise = firstValueFrom(
      service.createDatabaseSnapshotFromDumps(
        MOCK_PROJECT_ID,
        MOCK_CREATE_DATABASE_SNAPSHOT_FROM_DUMPS_REQUEST
      )
    );

    const req = httpMock.expectOne(
      {
        method: "POST",
        url: `${MOCK_GATEWAY_URL}projects/${MOCK_PROJECT_ID}/infra/management/database-snapshots`,
      },
      "Request to create database snapshot from dumps"
    );

    req.flush("Something went wrong", {
      status: 500,
      statusText: "Server Error",
    });

    await expect(configPromise).rejects.toBeInstanceOf(Error);
    await expect(configPromise).rejects.toHaveProperty(
      "message",
      "An unknown error occurred"
    );
  });

  it("should include dumpIds as query params when provided", async () => {
    const filterWithDumpIds = {
      ...MOCK_FETCH_DATABASE_SNAPSHOTS_FILTER,
      dumpIds: ["dumpId1", "dumpId2"],
    } as FetchDatabaseSnapshotsFilter;

    const configPromise = firstValueFrom(
      service.getAllDatabaseSnapshots(filterWithDumpIds)
    );

    const req = httpMock.expectOne((request) => {
      const url = request.urlWithParams;
      return (
        request.method === "GET" &&
        url.includes("dumpIds=dumpId1") &&
        url.includes("dumpIds=dumpId2")
      );
    }, "Request to get database snapshots with dump IDs");

    req.flush(MOCK_DATABASE_SNAPSHOT_PAGE);

    await expect(configPromise).resolves.toEqual(MOCK_DATABASE_SNAPSHOT_PAGE);
  });

  it("should call deleteDatabaseSnapshot and succeed", async () => {
    const configPromise = firstValueFrom(
      service.deleteDatabaseSnapshot(MOCK_DATABASE_SNAPSHOT_ID, MOCK_PROJECT_ID)
    );

    const req = httpMock.expectOne(
      {
        method: "PUT",
        url: `${MOCK_GATEWAY_URL}projects/${MOCK_PROJECT_ID}/infra/management/database-snapshots/${MOCK_DATABASE_SNAPSHOT_ID}/deallocate`,
      },
      "Request to delete database snapshot"
    );

    req.flush({});

    await expect(configPromise).resolves.toEqual({});
  });

  it("should handle errors from deleteDatabaseSnapshot", async () => {
    const configPromise = firstValueFrom(
      service.deleteDatabaseSnapshot(
        MOCK_DATABASE_SNAPSHOT_ID_2,
        MOCK_PROJECT_ID
      )
    );

    const req = httpMock.expectOne(
      {
        method: "PUT",
        url: `${MOCK_GATEWAY_URL}projects/${MOCK_PROJECT_ID}/infra/management/database-snapshots/${MOCK_DATABASE_SNAPSHOT_ID_2}/deallocate`,
      },
      "Request to delete database snapshot"
    );

    req.flush("Delete failed", { status: 500, statusText: "Server Error" });

    await expect(configPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    await expect(configPromise).rejects.toMatchObject({
      status: 500,
      statusText: "Server Error",
    });
    await expect(configPromise).rejects.toHaveProperty(
      "error",
      "Delete failed"
    );
  });
});
