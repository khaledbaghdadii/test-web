import { BusinessProcessGlobalUriFactoryPipe } from "./business-process-global-uri-factory.pipe";
import { BusinessProcessGlobalUriFactoryService } from "./business-process-global-uri-factory.service";
import { TestBed } from "@angular/core/testing";

const projectId = "projectId";

describe("BusinessProcessGlobalUriFactoryPipe", () => {
  let pipe: BusinessProcessGlobalUriFactoryPipe;
  let service: jest.Mocked<BusinessProcessGlobalUriFactoryService>;
  beforeEach(() => {
    service = {
      constructBusinessProcessExecutionUri: jest.fn(),
    } as unknown as jest.Mocked<BusinessProcessGlobalUriFactoryService>;

    TestBed.configureTestingModule({
      providers: [
        BusinessProcessGlobalUriFactoryPipe,
        {
          provide: BusinessProcessGlobalUriFactoryService,
          useValue: service,
        },
      ],
    });

    pipe = TestBed.inject(BusinessProcessGlobalUriFactoryPipe);
  });

  it("should call service to construct uri", () => {
    const id = "id";
    const expectedUri = "expectedUri";
    service.constructBusinessProcessExecutionUri.mockReturnValue(expectedUri);

    const uri = pipe.transform(id, projectId);

    expect(service.constructBusinessProcessExecutionUri).toHaveBeenCalledWith(
      id,
      projectId
    );
    expect(uri).toEqual(expectedUri);
  });
});
