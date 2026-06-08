import { EditBinaryImpactModalComponent } from "./edit-binary-impact-modal.component";
import { lastValueFrom, Observable, of, Subject, throwError } from "rxjs";
import { EditBinaryImpactRequest } from "./edit-binary-impact-request.model";
import { BinaryImpactService } from "../binary-impact.service";
import { v4 as uuidv4 } from "uuid";
import { BinaryImpactTestUtils } from "../binary-impact-test-utils";
import { UploadBinaryImpactAttachmentResponse } from "../upload-binary-impact-attachment-response";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { MockComponents } from "ng-mocks";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { AttachmentUploaderComponent } from "@mxflow/features/attachment";
import { UpgradeImpactInputComponent } from "../../upgrade-impact/upgrade-impact-input/upgrade-impact-input.component";
import { ClientImpactNoteSingleSelectDropdownComponent } from "../../client-impact-note/client-impact-note-single-select-dropdown/client-impact-note-single-select-dropdown.component";
import { ClientImpactNoteMultiSelectDropdownComponent } from "@mxflow/features/failure-management";
import { SkeletonModule } from "primeng/skeleton";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DomTestUtils } from "@mxevolve/testing";
import { IncidentInputComponent } from "@mxflow/features/incident-management";

const binaryImpactAttachment = {
  attachmentId: "attachmentId",
  name: "attachmentName",
  type: "attachmentType",
  downloadLink: "downloadLink",
};
const uploadAttachmentResponse = {
  id: BinaryImpactTestUtils.ATTACHMENT_ID,
  downloadLink: BinaryImpactTestUtils.ATTACHMENT_LINK,
};
describe("EditBinaryImpactModalComponent", () => {
  const binaryImpactId = "projectId";
  const projectId = "projectId";
  const title = "title";
  const description = "description";
  const upgradeImpactId = "upgrade impact id";
  const region = "region";
  const stream = "stream";
  const magnitude = "magnitude";
  const resolutionType = "resolutionType";
  const sourceType = "sourceType";
  const impactedOutputs = "impactedOutputs";
  const propagationQuery = "propagationQuery";
  const propagationPattern = "propagationPattern";
  const configurationDesign = "configurationDesign";
  const identificationPattern = "identificationPattern";
  const cbpmL1L2L3 = ["cbpmL1L2L3", "cbpmL1L2L3-2"];
  const cbpmL3L4 = ["cbpmL3L4", "cbpmL3L4-2"];
  const cbpmL2Scope = ["cbpmL2Scope", "cbpmL2Scope-2"];

  let component: EditBinaryImpactModalComponent;
  let fixture: ComponentFixture<EditBinaryImpactModalComponent>;
  let binaryImpactService: BinaryImpactService;
  let toastMessageService: ToastMessageService;

  beforeEach(() => {
    jest.useFakeTimers();
    binaryImpactService = {
      getById: jest.fn(() =>
        of(BinaryImpactTestUtils.getBinaryImpact(uuidv4()))
      ),
      update: jest.fn(() => of(null)),
      upload: jest.fn(() => of(uploadAttachmentResponse)),
    } as unknown as BinaryImpactService;
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;
    TestBed.configureTestingModule({
      imports: [EditBinaryImpactModalComponent],
      providers: [provideNoopAnimations()],
    }).overrideComponent(EditBinaryImpactModalComponent, {
      set: {
        imports: [
          MockComponents(
            UpgradeImpactInputComponent,
            QuillEditorComponent,
            AttachmentUploaderComponent,
            ClientImpactNoteSingleSelectDropdownComponent,
            ClientImpactNoteMultiSelectDropdownComponent,
            IncidentInputComponent
          ),
          SkeletonModule,
          DialogModule,
          MandatoryFieldModule,
          ButtonModule,
          ReactiveFormsModule,
          FormsModule,
        ],
        providers: [
          {
            provide: BinaryImpactService,
            useValue: binaryImpactService,
          },
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(EditBinaryImpactModalComponent);
    component = fixture.componentInstance;
    component.projectId = projectId;
    component.binaryImpactId = binaryImpactId;
  });

  describe("ngOnInit", () => {
    it("should set the upgrade impact id to null if it is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        upgradeImpactId: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.upgradeImpactId.value
      ).toBeNull();
    });

    it("should set the actual initial value of upgrade impact id if it is provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        upgradeImpactId: upgradeImpactId,
      });

      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.upgradeImpactId.value
      ).toEqual(upgradeImpactId);
    });

    it("should disable not editable form fields", () => {
      component.ngOnInit();
      expect(
        component.editBinaryImpactForm.controls.mxVersion.disabled
      ).toBeTruthy();
    });
  });

  describe("ngOnDestroy", () => {
    it("should destroy subject", () => {
      const destroyNextSpy = jest.spyOn(component["destroy$"], "next");
      const destroyCompleteSpy = jest.spyOn(component["destroy$"], "complete");

      component.ngOnDestroy();

      expect(destroyNextSpy).toHaveBeenCalled();
      expect(destroyCompleteSpy).toHaveBeenCalled();
    });
  });

  describe("opening the modal", () => {
    it("should make isModalShown true", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());

      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.isModalShown).toBeTruthy();
    });

    it("should initialize form values", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));

      component.isModalShown = true;

      expect(binaryImpactService.getById).toHaveBeenCalledWith(
        projectId,
        binaryImpactId
      );
      expect(component.editBinaryImpactForm.controls.title.value).toEqual(
        binaryImpact.title
      );
      expect(component.editBinaryImpactForm.controls.description.value).toEqual(
        binaryImpact.description
      );
      expect(component.editBinaryImpactForm.controls.mxVersion.value).toEqual(
        binaryImpact.mxVersion
      );

      expect(component.attachments).toEqual([
        {
          attachmentId: binaryImpact.attachments[0].attachmentId,
          name: binaryImpact.attachments[0].name,
          type: binaryImpact.attachments[0].type,
          downloadLink: binaryImpact.attachments[0].downloadLink,
          deleteLink: BinaryImpactTestUtils.getDeleteLink(
            projectId,
            binaryImpactId,
            binaryImpact.attachments[0].attachmentId
          ),
        },
      ]);

      expect(component.isFormLoading).toBeFalsy();
    });

    it("should initialize region field with binary impact region id", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.editBinaryImpactForm.controls.region.value).toEqual(
        binaryImpact.region.id
      );
    });

    it("should should set region to null when it is not provided in the binary impact", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        region: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.editBinaryImpactForm.controls.region.value).toBeNull();
    });

    it("should initialize stream field with binary impact stream id", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.editBinaryImpactForm.controls.stream.value).toEqual(
        binaryImpact.stream.id
      );
    });

    it("should should set stream to null when it is not provided in the binary impact", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        stream: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.editBinaryImpactForm.controls.stream.value).toBeNull();
    });

    it("should initialize resolution type field with binary impact resolution type id", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.resolutionType.value
      ).toEqual(binaryImpact.resolutionType.id);
    });

    it("should set resolution type to null when it is not provided in the binary impact", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        resolutionType: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.resolutionType.value
      ).toBeNull();
    });

    it("should initialize source type field with binary impact source type id", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.editBinaryImpactForm.controls.sourceType.value).toEqual(
        binaryImpact.sourceType.id
      );
    });

    it("should set source type to null when it is not provided in the binary impact", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        sourceType: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.sourceType.value
      ).toBeNull();
    });

    it("should initialize impacted outputs field with binary impact impacted outputs id", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.impactedOutputs.value
      ).toEqual(binaryImpact.impactedOutputs?.id);
    });

    it("should set impacted outputs to null if binary impact impacted outputs is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        impactedOutputs: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.impactedOutputs.value
      ).toBeNull();
    });

    it("should initialize cbpmL1L2L3 field with binary impact cbpmL1L2L3 ids", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      const cbpmL1L2L3Ids = binaryImpact.cbpmL1L2L3.map((item) => item.id);
      expect(component.editBinaryImpactForm.controls.cbpmL1L2L3.value).toEqual(
        cbpmL1L2L3Ids
      );
    });

    it("should initialize cbpmL2Scope field with binary impact cbpmL2Scope ids", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      const cbpmL2ScopeIds = binaryImpact.cbpmL2Scope.map((item) => item.id);
      expect(component.editBinaryImpactForm.controls.cbpmL2Scope.value).toEqual(
        cbpmL2ScopeIds
      );
    });

    it("should initialize cbpmL3L4 field with binary impact cbpmL3L4 ids", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      const cbpmL3L4Ids = binaryImpact.cbpmL3L4.map((item) => item.id);
      expect(component.editBinaryImpactForm.controls.cbpmL3L4.value).toEqual(
        cbpmL3L4Ids
      );
    });

    it("should initialize magnitude field with binary impact magnitude", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(component.editBinaryImpactForm.controls.magnitude.value).toEqual(
        binaryImpact.magnitude
      );
    });

    it("should set magnitude to null if binary impact's magnitude is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        magnitude: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.magnitude.value
      ).toBeNull();
    });

    it("should initialize propagation query field with binary impact propagation query", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.propagationQuery.value
      ).toEqual(binaryImpact.propagationQuery);
    });

    it("should set propagation query to null if binary impact's propagation query is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        propagationQuery: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.propagationQuery.value
      ).toBeNull();
    });

    it("should initialize propagation pattern field with binary impact propagation pattern", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.propagationPattern.value
      ).toEqual(binaryImpact.propagationPattern);
    });

    it("should set propagation pattern to null if binary impact's propagation pattern is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        propagationPattern: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.propagationPattern.value
      ).toBeNull();
    });

    it("should initialize configuration design field with binary impact configuration design", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.configurationDesign.value
      ).toEqual(binaryImpact.configurationDesign);
    });

    it("should set configuration design to null if binary impact's configuration design is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        configurationDesign: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.configurationDesign.value
      ).toBeNull();
    });

    it("should initialize identification pattern field with binary impact identification pattern", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4());
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.identificationPattern.value
      ).toEqual(binaryImpact.identificationPattern);
    });

    it("should set identification pattern to null if binary impact's identification pattern is not provided", () => {
      const binaryImpact = BinaryImpactTestUtils.getBinaryImpact(uuidv4(), {
        identificationPattern: undefined,
      });
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(of(binaryImpact));
      component.isModalShown = true;
      expect(
        component.editBinaryImpactForm.controls.identificationPattern.value
      ).toBeNull();
    });

    it("should not fetch binary impact if modal shown is set to false", () => {
      component.isModalShown = false;

      expect(binaryImpactService.getById).not.toHaveBeenCalled();
    });

    it("should display error if fetching binary impact fails", () => {
      jest
        .spyOn(binaryImpactService, "getById")
        .mockReturnValue(throwError(throwException()));

      component.isModalShown = true;

      expect(toastMessageService.showError).toHaveBeenCalledWith(
        BinaryImpactTestUtils.ERROR_MESSAGE
      );
      expect(component.isFormLoading).toBeFalsy();
    });
  });

  describe("cancelling the modal", () => {
    it("should emit event", () => {
      const closeModalEmitSpy = jest.spyOn(component.closeModalEvent, "emit");

      component.onCancel();

      expect(closeModalEmitSpy).toHaveBeenCalled();
    });
  });

  describe("form validation", () => {
    it.each(["", "   "])(
      "should be invalid when description is blank",
      (description: string) => {
        component.editBinaryImpactForm.controls.description.setValue(
          description
        );
        expect(
          component.editBinaryImpactForm.controls.description.valid
        ).toBeFalsy();
      }
    );

    it.each(["", "   ", "hello".repeat(100)])(
      "should be invalid when title is blank or too long",
      (title: string) => {
        component.editBinaryImpactForm.controls.title.setValue(title);

        expect(component.editBinaryImpactForm.valid).toBeFalsy();
      }
    );

    it("should be invalid when region is not provided", () => {
      component.editBinaryImpactForm.controls.region.setValue(null);
      expect(component.editBinaryImpactForm.controls.region.valid).toBeFalsy();
    });

    it("should be invalid when stream is not provided", () => {
      component.editBinaryImpactForm.controls.stream.setValue(null);
      expect(component.editBinaryImpactForm.controls.stream.valid).toBeFalsy();
    });

    it("should be invalid when source type is not provided", () => {
      component.editBinaryImpactForm.controls.sourceType.setValue(null);
      expect(
        component.editBinaryImpactForm.controls.sourceType.valid
      ).toBeFalsy();
    });

    it("should be invalid when resolution type is not provided", () => {
      component.editBinaryImpactForm.controls.resolutionType.setValue(null);
      expect(
        component.editBinaryImpactForm.controls.resolutionType.valid
      ).toBeFalsy();
    });

    it("should be invalid when cbpmL1L2L3 is not provided", () => {
      component.editBinaryImpactForm.controls.cbpmL1L2L3.setValue(null);
      expect(
        component.editBinaryImpactForm.controls.cbpmL1L2L3.valid
      ).toBeFalsy();
    });

    it("should be invalid when cbpmL2Scope is not provided", () => {
      component.editBinaryImpactForm.controls.cbpmL2Scope.setValue(null);
      expect(
        component.editBinaryImpactForm.controls.cbpmL2Scope.valid
      ).toBeFalsy();
    });
  });

  describe("submitting the form", () => {
    const title = "title";
    const description = "description";

    beforeEach(() => {
      component.editBinaryImpactForm.controls.title.setValue(title);
      component.editBinaryImpactForm.controls.description.setValue(description);
      component.editBinaryImpactForm.controls.upgradeImpactId.setValue(
        upgradeImpactId
      );
      component.editBinaryImpactForm.controls.region.setValue(region);
      component.editBinaryImpactForm.controls.stream.setValue(stream);
      component.editBinaryImpactForm.controls.magnitude.setValue(magnitude);
      component.editBinaryImpactForm.controls.resolutionType.setValue(
        resolutionType
      );
      component.editBinaryImpactForm.controls.sourceType.setValue(sourceType);
      component.editBinaryImpactForm.controls.cbpmL3L4.setValue(cbpmL3L4);
      component.editBinaryImpactForm.controls.cbpmL1L2L3.setValue(cbpmL1L2L3);
      component.editBinaryImpactForm.controls.cbpmL2Scope.setValue(cbpmL2Scope);
      component.editBinaryImpactForm.controls.impactedOutputs.setValue(
        impactedOutputs
      );
      component.editBinaryImpactForm.controls.propagationQuery.setValue(
        propagationQuery
      );
      component.editBinaryImpactForm.controls.propagationPattern.setValue(
        propagationPattern
      );
      component.editBinaryImpactForm.controls.configurationDesign.setValue(
        configurationDesign
      );
      component.editBinaryImpactForm.controls.identificationPattern.setValue(
        identificationPattern
      );
    });

    it("should update binary impact", () => {
      component.onFormSubmission();

      expect(binaryImpactService.update).toHaveBeenCalledWith(
        projectId,
        binaryImpactId,
        getEditRequest()
      );
      expect(component.isButtonLoading).toBeFalsy();
    });

    it("should emit binary impact update message with undefined upgrade impact id if not set", () => {
      component.editBinaryImpactForm.controls.upgradeImpactId.setValue(null);
      component.onFormSubmission();
      expect(binaryImpactService.update).toHaveBeenCalledWith(
        projectId,
        binaryImpactId,
        {
          ...getEditRequest(),
          upgradeImpactId: undefined,
        }
      );
    });

    it("should emit success message on successful update", () => {
      component.onFormSubmission();

      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        "Binary impact edited successfully"
      );
    });

    it("should emit close modal event on successful update", () => {
      const emitSpy = jest.spyOn(component.closeModalEvent, "emit");

      component.onFormSubmission();

      expect(emitSpy).toHaveBeenCalled();
    });

    it("should emit binary impact updated event on successful update", () => {
      const emitSpy = jest.spyOn(component.binaryImpactEdited, "emit");

      component.onFormSubmission();

      expect(emitSpy).toHaveBeenCalled();
    });

    it("should display error message on failure to update binary impact", () => {
      jest
        .spyOn(binaryImpactService, "update")
        .mockReturnValue(throwError(throwException()));

      component.onFormSubmission();

      expect(toastMessageService.showError).toHaveBeenCalledWith(
        BinaryImpactTestUtils.ERROR_MESSAGE
      );
      expect(component.isButtonLoading).toBeFalsy();
    });

    it("upload method should delegate to the binary impact service", async () => {
      const result = await lastValueFrom(
        component.upload(BinaryImpactTestUtils.FILE_1)
      );
      expect(binaryImpactService.upload).toHaveBeenCalledWith(
        projectId,
        binaryImpactId,
        BinaryImpactTestUtils.FILE_1
      );
      expect(result).toEqual({
        attachmentId: uploadAttachmentResponse.id,
        downloadLink: uploadAttachmentResponse.downloadLink,
      });
    });
    it("should handle error occurred in upgrade impact input component", () => {
      component.handleErrorOccurred("error message");
      expect(toastMessageService.showError).toHaveBeenCalledWith(
        "error message"
      );
    });
  });

  it("the upload method should update uploading multiple attachments is successful", () => {
    component.attachments = [];
    const firstAttachmentUploadSubject =
      new Subject<UploadBinaryImpactAttachmentResponse>();
    const secondAttachmentUploadSubject =
      new Subject<UploadBinaryImpactAttachmentResponse>();
    jest
      .spyOn(binaryImpactService, "upload")
      .mockImplementation(
        (projectId: string, binaryImpactId: string, file: File) =>
          file === BinaryImpactTestUtils.FILE_1
            ? firstAttachmentUploadSubject
            : secondAttachmentUploadSubject
      );
    component.upload(BinaryImpactTestUtils.FILE_1).subscribe();
    component.upload(BinaryImpactTestUtils.FILE_2).subscribe();
    jest.advanceTimersByTime(500);
    expect(component.uploadingAttachmentsCount[0]).toEqual(2);
    firstAttachmentUploadSubject.next(
      BinaryImpactTestUtils.SERVICE_UPLOAD_RESULT_2
    );
    firstAttachmentUploadSubject.complete();
    expect(component.uploadingAttachmentsCount[0]).toEqual(1);
    secondAttachmentUploadSubject.next(
      BinaryImpactTestUtils.SERVICE_UPLOAD_RESULT_2
    );
    secondAttachmentUploadSubject.complete();
    expect(component.uploadingAttachmentsCount[0]).toEqual(0);
  });

  it("the upload method should update uploading attachments count when uploading fails", () => {
    component.attachments = [];
    const attachmentUploadSubject =
      new Subject<UploadBinaryImpactAttachmentResponse>();
    jest
      .spyOn(binaryImpactService, "upload")
      .mockReturnValue(attachmentUploadSubject);
    component.upload(BinaryImpactTestUtils.FILE_1).subscribe();
    jest.advanceTimersByTime(500);
    expect(component.uploadingAttachmentsCount[0]).toEqual(1);
    attachmentUploadSubject.error(
      new Error(BinaryImpactTestUtils.ERROR_MESSAGE)
    );
    attachmentUploadSubject.complete();
    expect(component.uploadingAttachmentsCount[0]).toEqual(0);
  });

  it("should show error message if failed to upload", async () => {
    jest
      .spyOn(binaryImpactService, "upload")
      .mockReturnValue(throwError(throwException()));
    await expect(
      lastValueFrom(component.upload(BinaryImpactTestUtils.FILE_1))
    ).rejects.toThrow();
    expect(binaryImpactService.upload).toHaveBeenCalledWith(
      projectId,
      binaryImpactId,
      BinaryImpactTestUtils.FILE_1
    );
    expect(toastMessageService.showError).toHaveBeenCalledWith(
      `Error occurred when uploading ${BinaryImpactTestUtils.FILE_1.name}: ${BinaryImpactTestUtils.ERROR_MESSAGE}`
    );
  });
  it("should read the javascript this context correctly if the method is used in a different context", () => {
    uploadInDifferentContext(component.upload);
    jest.advanceTimersByTime(500);
    expect(binaryImpactService.upload).toHaveBeenCalled();
  });

  it("should default attachments to empty list", () => {
    expect(component.attachments).toEqual([]);
  });

  it("should append attachment correctly upon receiving uploaded event from quill", () => {
    const attachments = [
      { ...binaryImpactAttachment, attachmentId: "first attachment id" },
    ];
    component.attachments = attachments;
    component.appendAttachment(binaryImpactAttachment);
    expect(component.attachments).toEqual([
      ...attachments,
      {
        ...binaryImpactAttachment,
        deleteLink: BinaryImpactTestUtils.getDeleteLink(
          projectId,
          binaryImpactId,
          binaryImpactAttachment.attachmentId
        ),
      },
    ]);
  });
  describe("upload file tests", () => {
    it("should call the upload method on all the files", () => {
      const componentUploadMethod = jest.spyOn(component, "upload");
      component.uploadFiles([
        BinaryImpactTestUtils.FILE_1,
        BinaryImpactTestUtils.FILE_2,
      ]);
      jest.advanceTimersByTime(500);
      expect(componentUploadMethod).toHaveBeenCalledWith(
        BinaryImpactTestUtils.FILE_1
      );
      expect(componentUploadMethod).toHaveBeenCalledWith(
        BinaryImpactTestUtils.FILE_2
      );
    });

    it("should add uploaded files to attachment list", () => {
      const updateValueAndValiditySpy = jest.spyOn(
        component.editBinaryImpactForm.controls.attachments,
        "updateValueAndValidity"
      );
      component.attachments = [];
      jest
        .spyOn(component, "upload")
        .mockImplementation((file: File) =>
          file === BinaryImpactTestUtils.FILE_1
            ? of(BinaryImpactTestUtils.UPLOAD_RESULT_1)
            : of(BinaryImpactTestUtils.UPLOAD_RESULT_2)
        );
      component.uploadFiles([
        BinaryImpactTestUtils.FILE_1,
        BinaryImpactTestUtils.FILE_2,
      ]);
      jest.advanceTimersByTime(500);
      expect(component.attachments).toContainEqual({
        ...BinaryImpactTestUtils.ATTACHMENT_1,
        deleteLink: BinaryImpactTestUtils.getDeleteLink(
          projectId,
          binaryImpactId,
          BinaryImpactTestUtils.ATTACHMENT_1.attachmentId
        ),
      });
      expect(component.attachments).toContainEqual({
        ...BinaryImpactTestUtils.ATTACHMENT_2,
        deleteLink: BinaryImpactTestUtils.getDeleteLink(
          projectId,
          binaryImpactId,
          BinaryImpactTestUtils.ATTACHMENT_2.attachmentId
        ),
      });
      expect(component.attachments.length).toEqual(2);
      expect(component.editBinaryImpactForm.dirty).toBeTruthy();
      expect(updateValueAndValiditySpy).toHaveBeenCalledWith({
        onlySelf: true,
      });
    });
    it("should wait for all uploads to finish to mark that uploading attachments finished", () => {
      component.attachments = [];
      const secondAttachmentUploadSubject =
        new Subject<UploadBinaryImpactAttachmentResponse>();
      jest
        .spyOn(binaryImpactService, "upload")
        .mockImplementation(
          (projectId: string, binaryImpactId: string, file: File) =>
            file === BinaryImpactTestUtils.FILE_1
              ? of(BinaryImpactTestUtils.SERVICE_UPLOAD_RESULT_1)
              : secondAttachmentUploadSubject
        );
      component.uploadFiles([
        BinaryImpactTestUtils.FILE_1,
        BinaryImpactTestUtils.FILE_2,
      ]);
      jest.advanceTimersByTime(500);
      expect(component.uploadingAttachmentsCount[0]).toEqual(1);
      secondAttachmentUploadSubject.next(
        BinaryImpactTestUtils.SERVICE_UPLOAD_RESULT_2
      );
      secondAttachmentUploadSubject.complete();
      expect(component.uploadingAttachmentsCount[0]).toEqual(0);
    });
    it("should continue uploading the other attachments if one of the others failed", () => {
      component.attachments = [];
      const secondAttachmentUploadSubject =
        new Subject<UploadBinaryImpactAttachmentResponse>();
      jest
        .spyOn(binaryImpactService, "upload")
        .mockImplementation(
          (projectId: string, binaryImpactId: string, file: File) =>
            file === BinaryImpactTestUtils.FILE_1
              ? throwError(throwException())
              : secondAttachmentUploadSubject
        );
      component.uploadFiles([
        BinaryImpactTestUtils.FILE_1,
        BinaryImpactTestUtils.FILE_2,
      ]);
      jest.advanceTimersByTime(500);
      secondAttachmentUploadSubject.next(
        BinaryImpactTestUtils.SERVICE_UPLOAD_RESULT_2
      );
      secondAttachmentUploadSubject.complete();
      expect(component.attachments).toEqual([
        {
          ...BinaryImpactTestUtils.ATTACHMENT_2,
          deleteLink: BinaryImpactTestUtils.getDeleteLink(
            projectId,
            binaryImpactId,
            BinaryImpactTestUtils.ATTACHMENT_2.attachmentId
          ),
        },
      ]);
    });
  });
  it("should mark form as dirty upon attachment changes", () => {
    const updateValueAndValiditySpy = jest.spyOn(
      component.editBinaryImpactForm.controls.attachments,
      "updateValueAndValidity"
    );
    component.updateAttachments([]);
    expect(component.editBinaryImpactForm.dirty).toBeTruthy();
    expect(updateValueAndValiditySpy).toHaveBeenCalledWith({
      onlySelf: true,
    });
  });

  describe("submit button", () => {
    beforeEach(() => {
      component.isModalShown = true;
    });

    it("should disable submit button when the edit form is invalid", () => {
      component.editBinaryImpactForm.controls.title.setValue("");
      const submitButton = getButtonHarness("submit-button");
      expect(submitButton.isDisabled()).toBeTruthy();
    });

    it("should enable submit button when the edit form is valid", () => {
      component.editBinaryImpactForm.controls.title.setValue(title);
      component.editBinaryImpactForm.markAsDirty();
      component.uploadingAttachmentsCount[0] = 0;
      const submitButton = getButtonHarness("submit-button");
      expect(submitButton.isDisabled()).toBeFalsy();
    });

    it("should call onFormSubmission method when submit button is clicked", () => {
      component.editBinaryImpactForm.controls.title.setValue(title);
      component.editBinaryImpactForm.markAsDirty();
      component.uploadingAttachmentsCount[0] = 0;
      const submitButton = getButtonHarness("submit-button");
      const onFormSubmissionSpy = jest.spyOn(component, "onFormSubmission");
      submitButton.click();
      expect(onFormSubmissionSpy).toHaveBeenCalled();
    });
  });

  describe("template tests", () => {
    beforeEach(() => {
      component.isModalShown = true;
      fixture.detectChanges();
    });

    it("should display identification pattern input when form is not loading", () => {
      component.isFormLoading = false;
      const identificationPatternInput = getElementByTestId(
        "identification-pattern-input"
      );
      expect(identificationPatternInput.isRendered()).toBeTruthy();
    });

    it("should not display identification pattern input when form is loading", () => {
      component.isFormLoading = true;
      const identificationPatternInput = getElementByTestId(
        "identification-pattern-input"
      );
      expect(identificationPatternInput.isRendered()).toBeFalsy();
    });

    it("should display propagation pattern input when form is not loading", () => {
      component.isFormLoading = false;
      const propagationPatternInput = getElementByTestId(
        "propagation-pattern-input"
      );
      expect(propagationPatternInput.isRendered()).toBeTruthy();
    });

    it("should not display propagation pattern input when form is loading", () => {
      component.isFormLoading = true;
      const propagationPatternInput = getElementByTestId(
        "propagation-pattern-input"
      );
      expect(propagationPatternInput.isRendered()).toBeFalsy();
    });

    it("should display propagation query input when form is not loading", () => {
      component.isFormLoading = false;
      const propagationQueryInput = getElementByTestId(
        "propagation-query-input"
      );
      expect(propagationQueryInput.isRendered()).toBeTruthy();
    });

    it("should not display propagation query input when form is loading", () => {
      component.isFormLoading = true;
      const propagationQueryInput = getElementByTestId(
        "propagation-query-input"
      );
      expect(propagationQueryInput.isRendered()).toBeFalsy();
    });

    it("should display resolution type input when form is not loading", () => {
      component.isFormLoading = false;
      const resolutionTypeInput = getElementByTestId("resolution-type-input");
      expect(resolutionTypeInput.isRendered()).toBeTruthy();
    });

    it("should not display resolution type input when form is loading", () => {
      component.isFormLoading = true;
      const resolutionTypeInput = getElementByTestId("resolution-type-input");
      expect(resolutionTypeInput.isRendered()).toBeFalsy();
    });

    it("should display source type input when form is not loading", () => {
      component.isFormLoading = false;
      const sourceTypeInput = getElementByTestId("source-type-input");
      expect(sourceTypeInput.isRendered()).toBeTruthy();
    });

    it("should not display source type input when form is loading", () => {
      component.isFormLoading = true;
      const sourceTypeInput = getElementByTestId("source-type-input");
      expect(sourceTypeInput.isRendered()).toBeFalsy();
    });

    it("should display configuration design when form is not loading", () => {
      component.isFormLoading = false;
      const configurationDesignInput = getElementByTestId(
        "configuration-design-input"
      );
      expect(configurationDesignInput.isRendered()).toBeTruthy();
    });

    it("should not display configuration design when form is loading", () => {
      component.isFormLoading = true;
      const configurationDesignInput = getElementByTestId(
        "configuration-design-input"
      );
      expect(configurationDesignInput.isRendered()).toBeFalsy();
    });

    it("should display magnitude input when form is not loading", () => {
      component.isFormLoading = false;
      const magnitudeInput = getElementByTestId("magnitude-input");
      expect(magnitudeInput.isRendered()).toBeTruthy();
    });

    it("should not display magnitude input when form is loading", () => {
      component.isFormLoading = true;
      const magnitudeInput = getElementByTestId("magnitude-input");
      expect(magnitudeInput.isRendered()).toBeFalsy();
    });

    it("should display impacted outputs input when form is not loading", () => {
      component.isFormLoading = false;
      const impactedOutputsInput = getElementByTestId("impacted-outputs-input");
      expect(impactedOutputsInput.isRendered()).toBeTruthy();
    });

    it("should not display impacted outputs input when form is loading", () => {
      component.isFormLoading = true;
      const impactedOutputsInput = getElementByTestId("impacted-outputs-input");
      expect(impactedOutputsInput.isRendered()).toBeFalsy();
    });

    it("should display cbpmL1L2L3 input when form is not loading", () => {
      component.isFormLoading = false;
      const cbpmL1L2L3Input = getElementByTestId("cbpmL1L2L3-input");
      expect(cbpmL1L2L3Input.isRendered()).toBeTruthy();
    });

    it("should not display cbpmL1L2L3 input when form is loading", () => {
      component.isFormLoading = true;
      const cbpmL1L2L3Input = getElementByTestId("cbpmL1L2L3-input");
      expect(cbpmL1L2L3Input.isRendered()).toBeFalsy();
    });

    it("should display cbpmL2Scope input when form is not loading", () => {
      component.isFormLoading = false;
      const cbpmL2ScopeInput = getElementByTestId("cbpmL2Scope-input");
      expect(cbpmL2ScopeInput.isRendered()).toBeTruthy();
    });

    it("should not display cbpmL2Scope input when form is loading", () => {
      component.isFormLoading = true;
      const cbpmL2ScopeInput = getElementByTestId("cbpmL2Scope-input");
      expect(cbpmL2ScopeInput.isRendered()).toBeFalsy();
    });

    it("should display cbpmL3L4 input when form is not loading", () => {
      component.isFormLoading = false;
      const cbpmL3L4Input = getElementByTestId("cbpmL3L4-input");
      expect(cbpmL3L4Input.isRendered()).toBeTruthy();
    });

    it("should not display cbpmL3L4 input when form is loading", () => {
      component.isFormLoading = true;
      const cbpmL3L4Input = getElementByTestId("cbpmL3L4-input");
      expect(cbpmL3L4Input.isRendered()).toBeFalsy();
    });

    it("should display stream input when form is not loading", () => {
      component.isFormLoading = false;
      const streamInput = getElementByTestId("stream-input");
      expect(streamInput.isRendered()).toBeTruthy();
    });

    it("should not display stream input when form is loading", () => {
      component.isFormLoading = true;
      const streamInput = getElementByTestId("stream-input");
      expect(streamInput.isRendered()).toBeFalsy();
    });

    it("should display region input when form is not loading", () => {
      component.isFormLoading = false;
      const regionInput = getElementByTestId("region-input");
      expect(regionInput.isRendered()).toBeTruthy();
    });

    it("should not display region input when form is loading", () => {
      component.isFormLoading = true;
      const regionInput = getElementByTestId("region-input");
      expect(regionInput.isRendered()).toBeFalsy();
    });
  });

  function getElementByTestId(testId: string) {
    return DomTestUtils.getElementByTestId<
      EditBinaryImpactModalComponent,
      HTMLElement
    >(fixture, testId);
  }

  function uploadInDifferentContext(
    upload: (file: File) => Observable<{
      downloadLink: string;
      attachmentId: string;
    }>
  ) {
    upload(BinaryImpactTestUtils.FILE_1).subscribe();
  }

  function getEditRequest(): EditBinaryImpactRequest {
    return {
      title: title,
      description: description,
      upgradeImpactId: upgradeImpactId,
      region: region,
      stream: stream,
      magnitude: magnitude,
      sourceType: sourceType,
      resolutionType: resolutionType,
      impactedOutputs: impactedOutputs,
      propagationQuery: propagationQuery,
      propagationPattern: propagationPattern,
      configurationDesign: configurationDesign,
      identificationPattern: identificationPattern,
      cbpmL3L4: cbpmL3L4,
      cbpmL1L2L3: cbpmL1L2L3,
      cbpmL2Scope: cbpmL2Scope,
    };
  }

  function throwException() {
    return () => new Error(BinaryImpactTestUtils.ERROR_MESSAGE);
  }

  function getButtonHarness(testId: string) {
    return DomTestUtils.getButtonByTestId(fixture, testId);
  }
});
