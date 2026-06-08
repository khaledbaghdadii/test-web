import { FinalProductStatusResolverService } from "./final-product-status-resolver/final-product-status-resolver.service";
import { ToastMessageService } from "@mxflow/ui/alert";
import {
  concatMap,
  defer,
  delay,
  interval,
  lastValueFrom,
  merge,
  of,
  Subject,
  throwError,
} from "rxjs";
import { FinalProductService } from "../final-product.service";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MessageService } from "primeng/api";
import { FinalProduct } from "../model/final-product";
import { FinalProductDetailsComponent } from "./final-product-details.component";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { FinalProductApiResponse } from "../model/final-product-api-response";

const projectId = "projectId";
const finalProductId = "finalProductId";

function getFinalProduct(): FinalProduct {
  return {
    id: "finalProductId",
    projectId: "projectId",
    branch: "branch",
    repositoryId: "repositoryId",
    tag: "tag",
    validationLevel: "validationLevel",
    version: "version",
    environmentDefinitionId: "environmentDefinitionId",
    configurationCommitId: "configurationCommitId",
    state: "available",
    rtpProduct: {
      id: "id",
      tag: "tag",
      rtpCommitId: "rtpCommitId",
    },
    factoryProduct: {
      id: "id",
      type: "type",
      softwareProduct: {
        id: "id",
        version: "version",
        revision: "revision",
      },
    },
    clientConfigurations: [
      {
        id: "id",
        type: "type",
        branch: "branch",
        commitId: "commitId",
      },
    ],
    mxBundles: [
      {
        id: "id",
        type: "type",
      },
    ],
    isTools: [
      {
        id: "id",
        type: "type",
        name: "name",
      },
    ],
    createdOn: "createdOnDate",
    syncRequests: [],
  };
}

describe("FinalProductDetailsTableComponent", () => {
  let component: FinalProductDetailsComponent;
  let statusResolver: FinalProductStatusResolverService;
  let finalProductService: FinalProductService;
  let toastMessageService: ToastMessageService;
  let fixture: ComponentFixture<FinalProductDetailsComponent>;

  beforeEach(async () => {
    statusResolver = {
      resolveStatus: jest.fn(() => {
        return "available";
      }),
    } as unknown as FinalProductStatusResolverService;

    finalProductService = {
      getFinalProductById: jest.fn(() =>
        defer(() => of(getFinalProduct()).pipe(delay(100)))
      ),
    } as unknown as FinalProductService;

    toastMessageService = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    component = new FinalProductDetailsComponent(
      finalProductService,
      statusResolver
    );

    await TestBed.configureTestingModule({
      imports: [
        FinalProductDetailsComponent,
        TagModule,
        SkeletonModule,
        ProgressSpinnerModule,
      ],
      providers: [
        { provide: MessageService, useValue: { add: jest.fn() } },
        { provide: ToastMessageService, toastMessageService },
      ],
    })
      .overrideComponent(FinalProductDetailsComponent, {
        set: {
          providers: [
            { provide: FinalProductService, useValue: finalProductService },
            {
              provide: FinalProductStatusResolverService,
              useValue: statusResolver,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductDetailsComponent);
    component = fixture.componentInstance;
    component.finalProductId = finalProductId;
    component.projectId = projectId;
  });
  it("should fetch final product with correct params", async () => {
    component.ngOnInit();

    await lastValueFrom(component.finalProduct$);

    expect(finalProductService.getFinalProductById).toHaveBeenCalledWith(
      finalProductId,
      projectId
    );
  });

  it("should call resolveStatus with the correct state on ngOnInit", async () => {
    component.ngOnInit();
    await lastValueFrom(component.finalProduct$);

    expect(statusResolver.resolveStatus).toHaveBeenCalledWith("available");
  });

  it("should dispatch correct error message when failing to fetch final product by id", fakeAsync(() => {
    finalProductService.getFinalProductById = jest.fn(() =>
      throwError(() => new Error("ERROR_MESSAGE"))
    );
    const emitSpy = jest.spyOn(
      fixture.componentInstance.errorEventEmitter,
      "emit"
    );

    component.finalProductId = finalProductId;
    component.ngOnInit();

    component.finalProduct$.subscribe({
      complete: () => {
        expect(emitSpy).toHaveBeenCalledWith("ERROR_MESSAGE");
      },
    });

    tick();
  }));

  it("should complete destroy subject correctly on destroy", () => {
    const observable1 = interval(100).pipe(
      concatMap((value) => value.toString())
    );
    const observable2 = interval(100).pipe(
      concatMap((value) => value.toString())
    );

    const subject = new Subject();

    const projectIdObservable = merge(subject, observable1);
    const executionObservable = merge(subject, observable2);

    finalProductService = {
      getFinalProductById: jest
        .fn()
        .mockReturnValueOnce(executionObservable)
        .mockReturnValueOnce(projectIdObservable),
    } as unknown as FinalProductService;

    component = new FinalProductDetailsComponent(
      finalProductService,
      statusResolver
    );

    component.finalProductId = finalProductId;

    component.ngOnInit();
    lastValueFrom(component.finalProduct$);

    expect(subject.observed).toBe(true);
    component.ngOnDestroy();
    expect(subject.observed).toBe(false);
  });

  it("should show the skeleton loading component when final product details are not fetched yet", (done) => {
    component.ngOnInit();
    fixture.detectChanges();

    let skeleton = fixture.debugElement.query(By.css("p-skeleton"));
    expect(skeleton).toBeTruthy();

    component.finalProduct$.subscribe({
      complete: () => {
        fixture.whenStable();
        fixture.detectChanges();

        skeleton = fixture.debugElement.query(By.css("p-skeleton"));
        expect(skeleton).toBeFalsy();

        done();
      },
    });
  });

  it("should show the final product failure message when final product has failure message", () => {
    const finalProductWithFailure = {
      ...getFinalProduct(),
      failureMessage: "Failure Message",
    } as unknown as FinalProductApiResponse;

    finalProductService.getFinalProductById = jest.fn(() =>
      of(finalProductWithFailure)
    );
    component.ngOnInit();
    fixture.detectChanges();

    const failureMessageDiv = fixture.debugElement.query(
      By.css('[data-testid="final-product-details-failure-message"]')
    );
    expect(failureMessageDiv).toBeTruthy();
  });

  it("should not show the final product failure message when final product does not have failure message", () => {
    component.ngOnInit();
    fixture.detectChanges();

    const failureMessageDiv = fixture.debugElement.query(
      By.css('[data-testid="final-product-details-failure-message"]')
    );
    expect(failureMessageDiv).toBeFalsy();
  });
});
