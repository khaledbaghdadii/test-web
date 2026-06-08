import { FinalProduct } from "@mxflow/features/artifact-manager";
import { FinalProductFailureDetailsComponent } from "./final-product-failure-details.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import {
  AuthorizationService,
  ShowElementIfAuthorizedDirective,
} from "@mxflow/core/auth";
import { MockDirectives, ngMocks } from "ng-mocks";
import { By } from "@angular/platform-browser";

const projectId = "projectId";

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

describe("FinalProductFailureDetailsComponent", () => {
  let component: FinalProductFailureDetailsComponent;
  let fixture: ComponentFixture<FinalProductFailureDetailsComponent>;
  let mockAuthorizationService: any;

  beforeEach(async () => {
    mockAuthorizationService = {
      isAuthorized: jest.fn(() => of(true)),
    };
    await TestBed.configureTestingModule({
      imports: [
        FinalProductFailureDetailsComponent,
        MockDirectives(ShowElementIfAuthorizedDirective),
      ],
      schemas: [],
    })
      .overrideComponent(FinalProductFailureDetailsComponent, {
        set: {
          providers: [
            {
              provide: AuthorizationService,
              useValue: mockAuthorizationService,
            },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FinalProductFailureDetailsComponent);
    component = fixture.componentInstance;
  });

  it("should show no failure details message when final product has no failure message", () => {
    component.finalProduct = getFinalProduct();
    renderShowIfAuthorizedDirectives();
    fixture.detectChanges();

    const failureDetailsMessage = fixture.debugElement.query(
      By.css('[data-testid="no-failure-details"]')
    );
    const failureDetailsDiv = fixture.debugElement.query(
      By.css('[data-testid="failure-message-div"]')
    );

    expect(failureDetailsMessage).toBeTruthy();
    expect(failureDetailsDiv).toBeFalsy();
  });

  it("should show failure details div when final product has failure message", () => {
    component.finalProduct = {
      ...getFinalProduct(),
      failureMessage: "failure message",
    } as unknown as FinalProduct;
    renderShowIfAuthorizedDirectives();
    fixture.detectChanges();

    const failureDetailsMessage = fixture.debugElement.query(
      By.css('[data-testid="no-failure-details"]')
    );
    const failureDetailsDiv = fixture.debugElement.query(
      By.css('[data-testid="failure-message-div"]')
    );

    expect(failureDetailsMessage).toBeFalsy();
    expect(failureDetailsDiv).toBeTruthy();
  });

  it("should have correct authorization on container div", () => {
    component.finalProduct = getFinalProduct();
    renderShowIfAuthorizedDirectives();
    fixture.detectChanges();
    const div = fixture.debugElement.query(
      By.css('[data-testid="failure-message-div-container"]')
    );
    expect(div).toBeTruthy();
    const showElementDirective = ngMocks.findInstance(
      div,
      ShowElementIfAuthorizedDirective
    );
    expect(showElementDirective.showElementIfAuthorized).toEqual({
      action: "read",
      attributes: {},
      package: "artifact_management",
      resource: "final_product",
      projectId: projectId,
    });
  });
});

function renderShowIfAuthorizedDirectives() {
  const showElementIfAuthorizedDirectives = ngMocks.findInstances(
    ShowElementIfAuthorizedDirective
  );
  showElementIfAuthorizedDirectives.forEach((authDirective) =>
    ngMocks.render(authDirective, authDirective)
  );
}
