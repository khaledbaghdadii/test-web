import { DatabaseServersService } from "@mxflow/features/infra-management";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { delay, of, throwError } from "rxjs";
import { DatabaseServerVersionsApiResponse } from "../../model/response/database-server-versions-api-response";
import { DatabaseServerType } from "../../model/database-server-type";
import { DatabaseServerESDDropdownStateService } from "./database-server-esd-dropdown-state.service";

const PROJECT_ID = "PROJECT_ID";
const SERVER_TYPE = DatabaseServerType.ORACLE;
const DATABASE_SERVER_VERSION = "1.0";
describe("DatabaseServerESDDropdownStateService", () => {
  let service: DatabaseServerESDDropdownStateService;
  let databaseServersServiceMock: jest.Mocked<DatabaseServersService>;

  beforeEach(() => {
    databaseServersServiceMock = {
      getDatabaseServerVersions: jest.fn(),
    } as unknown as jest.Mocked<DatabaseServersService>;

    TestBed.configureTestingModule({
      providers: [
        DatabaseServerESDDropdownStateService,
        {
          provide: DatabaseServersService,
          useValue: databaseServersServiceMock,
        },
      ],
    });

    service = TestBed.inject(DatabaseServerESDDropdownStateService);
  });

  it("should initialize with default values", () => {
    expect(service.errorMessageSignal()).toBe("");
  });

  it("should set project ID", () => {
    service.setProjectIdSubject("123");
    service["projectIdSubject"].subscribe((value) => {
      expect(value).toBe("123");
    });
  });

  it("should set server type", () => {
    service.setServerTypeSubject(SERVER_TYPE);
    service["serverTypeSubject"].subscribe((value) => {
      expect(value).toBe(SERVER_TYPE);
    });
  });

  it("should set database server version", () => {
    service.setDatabaseServerVersion(DATABASE_SERVER_VERSION);
    service["databaseServerVersionSubject"].subscribe((value) => {
      expect(value).toBe(DATABASE_SERVER_VERSION);
    });
  });

  it("should get database server versions successfully", fakeAsync(() => {
    databaseServersServiceMock.getDatabaseServerVersions.mockReturnValueOnce(
      of(getDatabaseServerVersionsApiResponse()).pipe(delay(100))
    );

    service.setProjectIdSubject(PROJECT_ID);
    service.setServerTypeSubject(SERVER_TYPE);
    service.setDatabaseServerVersion(DATABASE_SERVER_VERSION);

    TestBed.flushEffects();
    tick(1000);
    expect(
      databaseServersServiceMock.getDatabaseServerVersions
    ).toHaveBeenCalledWith(PROJECT_ID, SERVER_TYPE);
    expect(service.databaseServerESDOptions()).toEqual(["1.0.1", "1.0.2"]);
  }));

  it("should handle errors when getting database server versions", fakeAsync(() => {
    const errorMessage = "Error getting database server versions";
    databaseServersServiceMock.getDatabaseServerVersions.mockReturnValue(
      throwError(() => new Error(errorMessage))
    );

    service.setProjectIdSubject("123");
    service.setServerTypeSubject(DatabaseServerType.SYBASE);
    service.setDatabaseServerVersion(DATABASE_SERVER_VERSION);

    TestBed.flushEffects();
    tick();

    expect(service.errorMessageSignal()).toBe(errorMessage);
  }));
});

function getDatabaseServerVersionsApiResponse(): DatabaseServerVersionsApiResponse {
  return {
    databaseServerVersions: [
      {
        version: "1.0",
        engineSpecificDetails: ["1.0.1", "1.0.2"],
      },
      {
        version: "2.0",
      },
    ],
  };
}
