import { BinaryImpactDetailsComponent } from "./binary-impact-details.component";
import { BinaryImpactService } from "../binary-impact.service";
import { of, throwError } from "rxjs";
import { BinaryImpactTestUtils } from "../binary-impact-test-utils";
import { ToastMessageService } from "@mxflow/ui/alert";
import { UpgradeImpact } from "../../upgrade-impact/model/upgrade-impact.model";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { APP_CONFIG } from "@mxflow/config";
import { MockComponents } from "ng-mocks";
import { AttachmentListComponent } from "@mxflow/features/attachment";
import { UpgradeImpactDetailsComponent } from "../../upgrade-impact";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { CommonModule, DatePipe } from "@angular/common";
import { Message } from "primeng/message";
import { By } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { v4 as uuidv4 } from "uuid";

const mockAppConfig = {
  gatewayUrl: "url",
};

describe("BinaryImpactDetailsComponent", () => {
  let fixture: ComponentFixture<BinaryImpactDetailsComponent>;
  let component: BinaryImpactDetailsComponent;
  let binaryImpactService: BinaryImpactService;
  let toastMessageService: ToastMessageService;

  beforeEach(async () => {
    binaryImpactService = {
      getById: jest.fn(() =>
        of(BinaryImpactTestUtils.getBinaryImpact(uuidv4()))
      ),
    } as unknown as BinaryImpactService;

    toastMessageService = {
      showError: jest.fn(),
    } as unknown as ToastMessageService;

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        BinaryImpactDetailsComponent,
        DatePipe,
        CommonModule,
        MockComponents(
          AttachmentListComponent,
          UpgradeImpactDetailsComponent,
          QuillEditorComponent,
          Message
        ),
      ],
      providers: [
        provideHttpClient(),
        { provide: APP_CONFIG, useValue: mockAppConfig },
      ],
    })
      .overrideComponent(BinaryImpactDetailsComponent, {
        add: {
          providers: [
            { provide: BinaryImpactService, useValue: binaryImpactService },
            { provide: ToastMessageService, useValue: toastMessageService },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BinaryImpactDetailsComponent);
    component = fixture.componentInstance;
  });

  it("handle error upon loading upgrade impact works correctly", () => {
    const message = "errorMessage";
    component.handleErrorOccurredUponLoadingUpgradeImpact(message);
    expect(toastMessageService.showError).toHaveBeenCalledWith(message);
  });

  it("should display correct message if an upgrade impact was not inherited from a binary impact", () => {
    jest.spyOn(binaryImpactService, "getById").mockReturnValue(
      of({
        ...BinaryImpactTestUtils.getBinaryImpact(uuidv4()),
        upgradeImpactId: undefined,
      })
    );

    fixture.detectChanges();

    const message = fixture.debugElement.query(By.directive(Message));
    expect(message.componentInstance.severity).toEqual("info");
    expect(message.nativeElement.textContent).toContain(
      "This Binary Impact does not inherit from any Upgrade Impact"
    );
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("ngOnInit", () => {
    it("should fetch binary impact by id", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());

      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));

      component.ngOnInit();
      expect(component.isLoading).toBeFalsy();
      expect(component.binaryImpact).toBeDefined();
      expect(component.binaryImpact).toEqual(binaryImpact);
    });

    it("should keep binary impact as undefined on failure to fetch by id", () => {
      const errorMessage = "error";
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(throwError(() => errorMessage));

      component.ngOnInit();

      expect(component.isLoading).toBeFalsy();
      expect(component.binaryImpact).toBeUndefined();
    });

    it("should emit error message on failure to fetch binary impact by id", () => {
      const errorMessage = "error";
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(throwError(() => errorMessage));
      const errorMessageEmitterMock = jest.spyOn(
        component.errorMessageEmitter,
        "emit"
      );

      component.ngOnInit();

      expect(errorMessageEmitterMock).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("should destroy", () => {
    const destroySpy = jest.spyOn(component["destroy$"], "next");
    const completeSpy = jest.spyOn(component["destroy$"], "complete");

    component.ngOnDestroy();

    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it("should set the upgrade impact correctly", () => {
    const upgradeImpact = getUpgradeImpact() as unknown as UpgradeImpact;
    component.setUpgradeImpact(upgradeImpact);
    expect(component.upgradeImpact).toEqual(upgradeImpact);
  });

  function getUpgradeImpact(): UpgradeImpact {
    return {
      id: "id",
      title: "title",
      impactType: "impactType",
      bpcFFTopic: ["bpc"],
      defects: [
        {
          defectId: "defectId",
          defectLink: "defectLink",
        },
      ],
      impactedOutputs: "impactedOutputs",
      fullDescription: "fullDescription",
      introducedInArchival: ["introducedInArchival"],
      externalIssue: {
        id: "id",
        link: "link",
        origin: "origin",
      },
      impactDocumentationTrigger: "impactDocumentationTrigger",
      introducedInReleaseVersion: ["introducedInReleaseVersion"],
      impactedInstrumentsScope: ["impactedInstrumentsScope"],
    };
  }
});
