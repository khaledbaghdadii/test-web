import { CreateBinaryImpactModalComponent } from "./create-binary-impact-modal.component";
import {
  AttachmentService,
  AttachmentTestUtils,
  AttachmentUploaderComponent,
  UploadProjectSpecificTemporaryAttachmentResponse,
} from "@mxflow/features/attachment";
import { BinaryImpactTestUtils } from "../binary-impact-test-utils";
import { Observable, of, Subject, throwError } from "rxjs";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { UploadBinaryImpactAttachmentResponse } from "../upload-binary-impact-attachment-response";
import { BinaryImpactService } from "../binary-impact.service";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockComponents } from "ng-mocks";
import { CreateUpgradeImpactJiraRedirectionButtonComponent } from "../../upgrade-impact/create-upgrade-impact-jira-redirection-button/create-upgrade-impact-jira-redirection-button.component";
import { DialogModule } from "primeng/dialog";
import { UpgradeImpactInputComponent } from "../../upgrade-impact/upgrade-impact-input/upgrade-impact-input.component";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { ButtonModule } from "primeng/button";
import { ClientImpactNoteSingleSelectDropdownComponent } from "../../client-impact-note/client-impact-note-single-select-dropdown/client-impact-note-single-select-dropdown.component";
import { ClientImpactNoteMultiSelectDropdownComponent } from "@mxflow/features/failure-management";
import { IncidentInputComponent } from "@mxflow/features/incident-management";

const projectId = "projectId";
const uploadAttachmentResult = {
  id: BinaryImpactTestUtils.UPLOAD_RESULT_1.attachmentId,
  downloadLink: BinaryImpactTestUtils.UPLOAD_RESULT_1.downloadLink,
};
const FILLED_FORM_VALUES = {
  title: "Test Title",
  description: "Test Description",
  mxVersion: "Test Mx Version",
  upgradeImpactId: "upgradeImpactId",
  identificationPattern: "identificationPattern",
  propagationPattern: "propagationPattern",
  propagationQuery: "propagationQuery",
  configurationDesign: "configurationDesign",
  magnitude: "magnitude",
  cbpmL1L2L3: ["cbpmL1L2L3", "cbpmL1L2L3-2"],
  cbpmL3L4: ["cbpmL3L4", "cbpmL3L4-2"],
  cbpmL2Scope: ["cbpmL2Scope", "cbpmL2Scope-2"],
  stream: "stream",
  region: "region",
  sourceType: "sourceType",
  resolutionType: "resolutionType",
  impactedOutputs: "impactedOutputs",
  incidentId: "incidentId",
};
describe("CreateBinaryImpactModalComponent", () => {
  let component: CreateBinaryImpactModalComponent;
  let fixture: ComponentFixture<CreateBinaryImpactModalComponent>;
  let toastMessageService: ToastMessageService;
  let attachmentService: AttachmentService;
  let binaryImpactService: BinaryImpactService;

  beforeEach(() => {
    toastMessageService = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
    } as unknown as ToastMessageService;

    attachmentService = {
      uploadTemporaryAttachment: jest.fn(() => of(uploadAttachmentResult)),
    } as unknown as AttachmentService;

    binaryImpactService = {
      createBinaryImpact: jest.fn(() =>
        of({ id: BinaryImpactTestUtils.BINARY_IMPACT_ID })
      ),
    } as unknown as BinaryImpactService;

    jest.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [CreateBinaryImpactModalComponent],
    }).overrideComponent(CreateBinaryImpactModalComponent, {
      set: {
        imports: [
          MockComponents(
            CreateUpgradeImpactJiraRedirectionButtonComponent,
            UpgradeImpactInputComponent,
            QuillEditorComponent,
            AttachmentUploaderComponent,
            ClientImpactNoteSingleSelectDropdownComponent,
            ClientImpactNoteMultiSelectDropdownComponent,
            IncidentInputComponent
          ),
          DialogModule,
          MandatoryFieldModule,
          ButtonModule,
        ],
        providers: [
          {
            provide: ToastMessageService,
            useValue: toastMessageService,
          },
          {
            provide: AttachmentService,
            useValue: attachmentService,
          },
          {
            provide: BinaryImpactService,
            useValue: binaryImpactService,
          },
        ],
      },
    });
    fixture = TestBed.createComponent(CreateBinaryImpactModalComponent);
    component = fixture.componentInstance;
    component.projectId = projectId;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("onSubmitCreateBinaryImpact", () => {
    it("should create the binary impact on submit", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);
      component.attachments = [
        BinaryImpactTestUtils.ATTACHMENT_1,
        BinaryImpactTestUtils.ATTACHMENT_2,
      ];

      component.onFormSubmission();

      expect(binaryImpactService.createBinaryImpact).toHaveBeenCalledWith(
        projectId,
        {
          ...FILLED_FORM_VALUES,
          attachmentIds: [
            BinaryImpactTestUtils.ATTACHMENT_1.attachmentId,
            BinaryImpactTestUtils.ATTACHMENT_2.attachmentId,
          ],
        }
      );
    });

    it("should create binary impact with empty optional fields", () => {
      const mockFormValues = {
        ...FILLED_FORM_VALUES,
        impactedOutputs: null,
        cbpmL3L4: null,
        identificationPattern: null,
        propagationPattern: null,
        propagationQuery: null,
        configurationDesign: null,
        magnitude: null,
        upgradeImpactId: null,
      };
      component.createBinaryImpactForm.setValue(mockFormValues);
      component.attachments = [
        BinaryImpactTestUtils.ATTACHMENT_1,
        BinaryImpactTestUtils.ATTACHMENT_2,
      ];

      component.onFormSubmission();

      expect(binaryImpactService.createBinaryImpact).toHaveBeenCalledWith(
        projectId,
        {
          ...mockFormValues,
          attachmentIds: [
            BinaryImpactTestUtils.ATTACHMENT_1.attachmentId,
            BinaryImpactTestUtils.ATTACHMENT_2.attachmentId,
          ],
          impactedOutputs: undefined,
          cbpmL3L4: undefined,
          identificationPattern: undefined,
          propagationPattern: undefined,
          propagationQuery: undefined,
          configurationDesign: undefined,
          magnitude: undefined,
          upgradeImpactId: undefined,
        }
      );
    });

    it("should emit binaryImpactCreated event with the creation response", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);
      const emitSpy = jest.spyOn(component.binaryImpactCreated, "emit");

      component.onFormSubmission();

      expect(emitSpy).toHaveBeenCalledWith({
        id: BinaryImpactTestUtils.BINARY_IMPACT_ID,
      });
    });

    it("should show success message on successful creation", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);

      component.onFormSubmission();

      expect(toastMessageService.showSuccess).toHaveBeenCalledWith(
        `The Binary Impact ${FILLED_FORM_VALUES.title} was created successfully.`
      );
    });

    it("should set is loading to false on creating binary impact successfully", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);

      component.onFormSubmission();

      expect(component.isLoading).toBe(false);
    });

    it("should set is binary impact created to true on creating binary impact successfully", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);
      component.onFormSubmission();

      expect(component["isBinaryImpactCreated"]).toBeTruthy();
    });

    it("should show error message on creation failure", () => {
      const errorMessage = "Error occurred";
      jest
        .spyOn(binaryImpactService, "createBinaryImpact")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);

      component.onFormSubmission();

      expect(toastMessageService.showError).toHaveBeenCalledWith(errorMessage);
    });

    it("should set is loading to false on failure to create binary impact", () => {
      const errorMessage = "Error occurred";
      jest
        .spyOn(binaryImpactService, "createBinaryImpact")
        .mockReturnValue(throwError(() => new Error(errorMessage)));
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);

      component.onFormSubmission();

      expect(component.isLoading).toBe(false);
    });
  });

  describe("onCancel", () => {
    it("should reset form values if binary impact is not created", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);
      component["isBinaryImpactCreated"] = false;
      component.onCancel();

      expect(component.createBinaryImpactForm.value).toEqual({
        title: null,
        description: null,
        mxVersion: null,
        upgradeImpactId: null,
        identificationPattern: null,
        propagationPattern: null,
        propagationQuery: null,
        configurationDesign: null,
        magnitude: null,
        cbpmL1L2L3: null,
        cbpmL3L4: null,
        cbpmL2Scope: null,
        stream: null,
        region: null,
        sourceType: null,
        resolutionType: null,
        impactedOutputs: null,
        incidentId: null,
      });
    });

    it("should reset form values if binary impact is created", () => {
      component.createBinaryImpactForm.setValue(FILLED_FORM_VALUES);
      component["isBinaryImpactCreated"] = true;
      component.onCancel();

      expect(component.createBinaryImpactForm.value).toEqual({
        title: null,
        description: null,
        mxVersion: null,
        upgradeImpactId: null,
        identificationPattern: null,
        propagationPattern: null,
        propagationQuery: null,
        configurationDesign: null,
        magnitude: null,
        cbpmL1L2L3: null,
        cbpmL3L4: null,
        cbpmL2Scope: null,
        stream: null,
        region: null,
        sourceType: null,
        resolutionType: null,
        impactedOutputs: null,
        incidentId: null,
      });
    });

    it("should reset isBinaryImpactCreated to false if the binary impact is created", () => {
      component["isBinaryImpactCreated"] = true;
      component.onCancel();

      expect(component["isBinaryImpactCreated"]).toBe(false);
    });

    it("should set isVisible to false", () => {
      component.onCancel();

      expect(component.isVisible).toBe(false);
    });

    it("should emit createBinaryImpactCanceled event", () => {
      const emitSpy = jest.spyOn(component.createBinaryImpactCancelled, "emit");
      component.onCancel();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  it("should set initial mxVersion value if available when showing link modal", () => {
    component.mxVersionInitialValue = "Test Mx Version";
    component.isVisible = true;
    expect(component.createBinaryImpactForm.controls.mxVersion.value).toEqual(
      "Test Mx Version"
    );
  });

  it("should set initial value of upgrade impact id correctly", () => {
    expect(
      component.createBinaryImpactForm.controls.upgradeImpactId.value
    ).toEqual(null);
  });

  it("should handle error occured in upgrade impact input", () => {
    component.handleErrorOccured("errorMessage");

    expect(toastMessageService.showError).toHaveBeenCalledWith("errorMessage");
  });

  it("upload method should delegate to the attachment service", (done) => {
    component.upload(BinaryImpactTestUtils.FILE_1).subscribe((result) => {
      expect(attachmentService.uploadTemporaryAttachment).toHaveBeenCalledWith(
        projectId,
        BinaryImpactTestUtils.FILE_1
      );
      expect(result).toEqual(BinaryImpactTestUtils.UPLOAD_RESULT_1);
      done();
    });
  });

  it("the upload method should update uploading counter when uploading multiple attachments is successful", () => {
    component.attachments = [];
    const firstAttachmentUploadSubject =
      new Subject<UploadProjectSpecificTemporaryAttachmentResponse>();
    const secondAttachmentUploadSubject =
      new Subject<UploadProjectSpecificTemporaryAttachmentResponse>();
    jest
      .spyOn(attachmentService, "uploadTemporaryAttachment")
      .mockImplementation((projectId: string, file: File) =>
        file === AttachmentTestUtils.FILE
          ? firstAttachmentUploadSubject
          : secondAttachmentUploadSubject
      );
    component.upload(AttachmentTestUtils.FILE).subscribe();
    component.upload(AttachmentTestUtils.FILE_2).subscribe();
    jest.advanceTimersByTime(500);
    expect(component.uploadingAttachmentsCount[0]).toEqual(2);
    firstAttachmentUploadSubject.next(
      AttachmentTestUtils.UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE
    );
    firstAttachmentUploadSubject.complete();
    expect(component.uploadingAttachmentsCount[0]).toEqual(1);
    secondAttachmentUploadSubject.next(
      AttachmentTestUtils.UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE
    );
    secondAttachmentUploadSubject.complete();
    expect(component.uploadingAttachmentsCount[0]).toEqual(0);
  });

  it("the upload method should update uploading attachments count when uploading fails", () => {
    component.attachments = [];
    const attachmentUploadSubject =
      new Subject<UploadBinaryImpactAttachmentResponse>();
    jest
      .spyOn(attachmentService, "uploadTemporaryAttachment")
      .mockReturnValue(attachmentUploadSubject);
    component.upload(AttachmentTestUtils.FILE).subscribe();
    jest.advanceTimersByTime(500);
    expect(component.uploadingAttachmentsCount[0]).toEqual(1);
    attachmentUploadSubject.error(new Error(AttachmentTestUtils.ERROR_MESSAGE));
    attachmentUploadSubject.complete();
    expect(component.uploadingAttachmentsCount[0]).toEqual(0);
  });

  it("should show error message if failed to upload", (done) => {
    jest
      .spyOn(attachmentService, "uploadTemporaryAttachment")
      .mockReturnValue(
        throwError(() => new Error(BinaryImpactTestUtils.ERROR_MESSAGE))
      );
    component.upload(BinaryImpactTestUtils.FILE_1).subscribe({
      error: () => {
        expect(
          attachmentService.uploadTemporaryAttachment
        ).toHaveBeenCalledWith(projectId, BinaryImpactTestUtils.FILE_1);
        expect(toastMessageService.showError).toHaveBeenCalledWith(
          `Error occurred when uploading ${BinaryImpactTestUtils.FILE_1.name}: ${BinaryImpactTestUtils.ERROR_MESSAGE}`
        );
        done();
      },
    });
  });
  it("should read the javascript this context correctly if the method is used in a different context", () => {
    uploadInDifferentContext(component.upload);
    jest.advanceTimersByTime(500);
    expect(attachmentService.uploadTemporaryAttachment).toHaveBeenCalled();
  });
  it("should append attachment correctly upon receiving uploaded event from quill", () => {
    component.attachments = [BinaryImpactTestUtils.ATTACHMENT_1];
    component.appendAttachment(BinaryImpactTestUtils.ATTACHMENT_2);
    expect(component.attachments).toEqual([
      BinaryImpactTestUtils.ATTACHMENT_1,
      BinaryImpactTestUtils.ATTACHMENT_2,
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
      expect(component.attachments).toContainEqual(
        BinaryImpactTestUtils.ATTACHMENT_1
      );
      expect(component.attachments).toContainEqual(
        BinaryImpactTestUtils.ATTACHMENT_2
      );
      expect(component.attachments.length).toEqual(2);
    });
    it("should wait for all uploads to finish to mark that uploading attachments finished", () => {
      component.attachments = [];
      const secondAttachmentUploadSubject =
        new Subject<UploadProjectSpecificTemporaryAttachmentResponse>();
      jest
        .spyOn(attachmentService, "uploadTemporaryAttachment")
        .mockImplementation((projectId: string, file: File) =>
          file === BinaryImpactTestUtils.FILE_1
            ? of(
                AttachmentTestUtils.UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE
              )
            : secondAttachmentUploadSubject
        );
      component.uploadFiles([
        BinaryImpactTestUtils.FILE_1,
        BinaryImpactTestUtils.FILE_2,
      ]);
      jest.advanceTimersByTime(500);
      expect(component.uploadingAttachmentsCount[0]).toEqual(1);
      secondAttachmentUploadSubject.next(
        AttachmentTestUtils.UPLOAD_PROJECT_SPECIFIC_ATTACHMENT_RESPONSE
      );
      secondAttachmentUploadSubject.complete();
      expect(component.uploadingAttachmentsCount[0]).toEqual(0);
    });
    it("should continue uploading the other attachments if one of the others failed", () => {
      component.attachments = [];
      const secondAttachmentUploadSubject =
        new Subject<UploadProjectSpecificTemporaryAttachmentResponse>();
      jest
        .spyOn(attachmentService, "uploadTemporaryAttachment")
        .mockImplementation((projectId: string, file: File) =>
          file === BinaryImpactTestUtils.FILE_1
            ? throwError(() => new Error(BinaryImpactTestUtils.ERROR_MESSAGE))
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
        BinaryImpactTestUtils.ATTACHMENT_2,
      ]);
    });
  });
});

function uploadInDifferentContext(
  upload: (file: File) => Observable<{
    downloadLink: string;
    attachmentId: string;
  }>
) {
  upload(BinaryImpactTestUtils.FILE_1).subscribe();
}
