import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { DialogModule } from "primeng/dialog";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { WhitespaceValidators } from "@mxflow/validator";
import { TextareaModule } from "primeng/textarea";
import { BinaryImpactService } from "../binary-impact.service";
import { BinaryImpact, ClientImpactNoteField } from "../binary-impact";
import { NgTemplateOutlet } from "@angular/common";
import {
  catchError,
  finalize,
  forkJoin,
  map,
  of,
  Subject,
  takeUntil,
  tap,
  throwError,
} from "rxjs";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { EditBinaryImpactRequest } from "./edit-binary-impact-request.model";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { UpgradeImpactInputComponent } from "../../upgrade-impact/upgrade-impact-input/upgrade-impact-input.component";
import {
  Attachment,
  AttachmentUploaderComponent,
} from "@mxflow/features/attachment";
import { ClientImpactNoteFieldType } from "@mxevolve/domains/test/data-access";
import { ClientImpactNoteMultiSelectDropdownComponent } from "../../client-impact-note";
import { ClientImpactNoteSingleSelectDropdownComponent } from "../../client-impact-note/client-impact-note-single-select-dropdown/client-impact-note-single-select-dropdown.component";
import { IncidentInputComponent } from "@mxflow/features/incident-management";

@Component({
  selector: "mxevolve-edit-binary-impact-modal",
  imports: [
    DialogModule,
    MandatoryFieldModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    TextareaModule,
    NgTemplateOutlet,
    ButtonModule,
    SkeletonModule,
    QuillEditorComponent,
    UpgradeImpactInputComponent,
    AttachmentUploaderComponent,
    ClientImpactNoteSingleSelectDropdownComponent,
    ClientImpactNoteMultiSelectDropdownComponent,
    IncidentInputComponent,
  ],
  providers: [BinaryImpactService],
  templateUrl: "./edit-binary-impact-modal.component.html",
})
export class EditBinaryImpactModalComponent implements OnInit, OnDestroy {
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly toastMessageService = inject(ToastMessageService);

  private _isModalShown: boolean;
  private readonly destroy$ = new Subject();

  editBinaryImpactForm: FormGroup<EditBinaryImpactForm>;

  isFormLoading: boolean;
  isButtonLoading: boolean;
  attachments: Attachment[] = [];
  readonly uploadingAttachmentsCount = new Int32Array(1);

  @Input({ required: true }) set isModalShown(value: boolean) {
    this._isModalShown = value;
    if (value) {
      this.fetchBinaryImpact();
    }
  }

  get isModalShown(): boolean {
    return this._isModalShown;
  }

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) binaryImpactId: string;
  @Input() warningMessage?: string;

  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() binaryImpactEdited = new EventEmitter<void>();

  constructor() {
    this.editBinaryImpactForm = new FormGroup<EditBinaryImpactForm>({
      title: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      description: new FormControl<string | null>(null, [
        Validators.required,
        WhitespaceValidators.notBlank(),
      ]),
      mxVersion: new FormControl<string | null>(null, [
        Validators.required,
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      incidentId: new FormControl<string | null>(null, []),
      attachments: new FormControl<null>(null),
      upgradeImpactId: new FormControl<string | null>(null),
      region: new FormControl<string | null>(null, [Validators.required]),
      stream: new FormControl<string | null>(null, [Validators.required]),
      magnitude: new FormControl<string | null>(null),
      sourceType: new FormControl<string | null>(null, [Validators.required]),
      resolutionType: new FormControl<string | null>(null, [
        Validators.required,
      ]),
      impactedOutputs: new FormControl<string | null>(null),
      propagationQuery: new FormControl<string | null>(null),
      propagationPattern: new FormControl<string | null>(null),
      configurationDesign: new FormControl<string | null>(null),
      identificationPattern: new FormControl<string | null>(null),
      cbpmL3L4: new FormControl<string[] | null>(null),
      cbpmL1L2L3: new FormControl<string[] | null>(null, [Validators.required]),
      cbpmL2Scope: new FormControl<string[] | null>(null, [
        Validators.required,
      ]),
    });
  }

  ngOnInit(): void {
    this.editBinaryImpactForm.controls.mxVersion.disable();
  }

  onCancel(): void {
    this.closeModalEvent.emit();
  }

  onFormSubmission(): void {
    this.isButtonLoading = true;
    this.binaryImpactService
      .update(this.projectId, this.binaryImpactId, this.getEditRequest())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastMessageService.showSuccess(
            "Binary impact edited successfully"
          );
          this.closeModalEvent.emit();
          this.binaryImpactEdited.emit();
        },
        error: (error) => {
          this.toastMessageService.showError(error.message);
        },
      })
      .add(() => {
        this.isButtonLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private fetchBinaryImpact() {
    this.isFormLoading = true;
    this.binaryImpactService
      .getById(this.projectId, this.binaryImpactId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (binaryImpact: BinaryImpact) => {
          this.setFormValue(binaryImpact);
          this.attachments = binaryImpact.attachments.map((attachment) => {
            return {
              ...attachment,
              deleteLink: this.constructDeleteBinaryImpactAttachmentLink(
                this.projectId,
                this.binaryImpactId,
                attachment.attachmentId
              ),
            };
          });
        },
        error: (error) => {
          this.toastMessageService.showError(error.message);
        },
      })
      .add(() => {
        this.isFormLoading = false;
      });
  }

  private setFormValue(binaryImpact: BinaryImpact) {
    this.editBinaryImpactForm.markAsPristine();
    this.editBinaryImpactForm.setValue({
      title: binaryImpact.title,
      description: binaryImpact.description,
      mxVersion: binaryImpact.mxVersion,
      upgradeImpactId: binaryImpact.upgradeImpactId ?? null,
      attachments: null,
      region: this.getClientImpactNoteFieldId(binaryImpact.region),
      stream: this.getClientImpactNoteFieldId(binaryImpact.stream),
      magnitude: binaryImpact.magnitude ?? null,
      incidentId: binaryImpact.incidentId ?? null,
      sourceType: this.getClientImpactNoteFieldId(binaryImpact.sourceType),
      resolutionType: this.getClientImpactNoteFieldId(
        binaryImpact.resolutionType
      ),
      impactedOutputs: this.getClientImpactNoteFieldId(
        binaryImpact.impactedOutputs
      ),
      propagationQuery: binaryImpact.propagationQuery ?? null,
      propagationPattern: binaryImpact.propagationPattern ?? null,
      configurationDesign: binaryImpact.configurationDesign ?? null,
      identificationPattern: binaryImpact.identificationPattern ?? null,
      cbpmL3L4: this.getClientImpactNoteFieldIds(binaryImpact.cbpmL3L4),
      cbpmL1L2L3: this.getClientImpactNoteFieldIds(binaryImpact.cbpmL1L2L3),
      cbpmL2Scope: this.getClientImpactNoteFieldIds(binaryImpact.cbpmL2Scope),
    });
  }

  private getClientImpactNoteFieldId(
    field: ClientImpactNoteField | undefined
  ): string | null {
    return field ? field.id : null;
  }

  private getClientImpactNoteFieldIds(
    listOfClientImpactNoteFields: ClientImpactNoteField[]
  ): string[] {
    return listOfClientImpactNoteFields.map((field) => field.id);
  }

  private getEditRequest(): EditBinaryImpactRequest {
    const formValue = this.editBinaryImpactForm.value;
    return {
      title: formValue.title as string,
      description: formValue.description as string,
      upgradeImpactId: formValue.upgradeImpactId ?? undefined,
      region: formValue.region as string,
      stream: formValue.stream as string,
      magnitude: formValue.magnitude as string,
      sourceType: formValue.sourceType as string,
      resolutionType: formValue.resolutionType as string,
      impactedOutputs: formValue.impactedOutputs as string,
      propagationQuery: formValue.propagationQuery as string,
      propagationPattern: formValue.propagationPattern as string,
      configurationDesign: formValue.configurationDesign as string,
      identificationPattern: formValue.identificationPattern as string,
      cbpmL1L2L3: formValue.cbpmL1L2L3 as string[],
      cbpmL2Scope: formValue.cbpmL2Scope as string[],
      cbpmL3L4: formValue.cbpmL3L4 as string[],
      incidentId: formValue.incidentId ?? undefined,
    };
  }

  handleErrorOccurred(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  constructDeleteBinaryImpactAttachmentLink(
    projectId: string,
    binaryImpactId: string,
    attachmentId: string
  ) {
    return `projects/${projectId}/failure-management/impacts/binary/${binaryImpactId}/attachment/${attachmentId}`;
  }

  upload = (file: File) => {
    this.incrementUploadingAttachmentCount();
    return this.binaryImpactService
      .upload(this.projectId, this.binaryImpactId, file)
      .pipe(
        map((response) => {
          return {
            attachmentId: response.id,
            downloadLink: response.downloadLink,
          };
        }),
        finalize(() => {
          this.decrementUploadingAttachmentCount();
        }),
        catchError((error) => {
          this.handleErrorOccurred(
            `Error occurred when uploading ${file.name}: ${error.message}`
          );
          return throwError(() => error);
        })
      );
  };

  appendAttachment(event: Attachment) {
    this.attachments = [
      ...this.attachments,
      {
        ...event,
        deleteLink: this.constructDeleteBinaryImpactAttachmentLink(
          this.projectId,
          this.binaryImpactId,
          event.attachmentId
        ),
      },
    ];
  }

  uploadFiles(files: File[]) {
    const filesUploadObservables = files.map((file) =>
      this.upload(file).pipe(
        catchError(() => {
          return of(undefined);
        }),
        tap((response) => {
          if (response) {
            this.addUploadedAttachmentToAttachmentList(response, file);
            this.markAttachmentsFormControlAsDirty();
          }
        })
      )
    );
    forkJoin(filesUploadObservables).subscribe();
  }

  private addUploadedAttachmentToAttachmentList(
    response: { downloadLink: string; attachmentId: string },
    file: File
  ) {
    this.attachments = [
      ...this.attachments,
      {
        downloadLink: response.downloadLink,
        attachmentId: response.attachmentId,
        name: file.name,
        type: file.type,
        deleteLink: this.constructDeleteBinaryImpactAttachmentLink(
          this.projectId,
          this.binaryImpactId,
          response.attachmentId
        ),
      },
    ];
  }

  updateAttachments(newAttachments: Attachment[]) {
    this.attachments = newAttachments;
    this.markAttachmentsFormControlAsDirty();
  }

  private markAttachmentsFormControlAsDirty() {
    this.editBinaryImpactForm.controls.attachments.markAsDirty();
    this.editBinaryImpactForm.controls.attachments.updateValueAndValidity({
      onlySelf: true,
    });
  }
  incrementUploadingAttachmentCount() {
    Atomics.add(this.uploadingAttachmentsCount, 0, 1);
  }

  decrementUploadingAttachmentCount() {
    Atomics.sub(this.uploadingAttachmentsCount, 0, 1);
  }
  protected readonly ClientImpactNoteFieldType = ClientImpactNoteFieldType;
}

export interface EditBinaryImpactForm {
  title: FormControl<string | null>;
  description: FormControl<string | null>;
  mxVersion: FormControl<string | null>;
  upgradeImpactId: FormControl<string | null>;
  attachments: FormControl<null>;
  region: FormControl<string | null>;
  stream: FormControl<string | null>;
  magnitude: FormControl<string | null>;
  sourceType: FormControl<string | null>;
  resolutionType: FormControl<string | null>;
  impactedOutputs: FormControl<string | null>;
  propagationQuery: FormControl<string | null>;
  propagationPattern: FormControl<string | null>;
  configurationDesign: FormControl<string | null>;
  identificationPattern: FormControl<string | null>;
  cbpmL3L4: FormControl<string[] | null>;
  cbpmL1L2L3: FormControl<string[] | null>;
  cbpmL2Scope: FormControl<string[] | null>;
  incidentId: FormControl<string | null>;
}
