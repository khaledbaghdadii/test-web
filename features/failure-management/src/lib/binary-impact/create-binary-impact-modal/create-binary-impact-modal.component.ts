import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { CreateBinaryImpactRequest } from "./create-binary-impact-request.model";
import { BinaryImpactService } from "../binary-impact.service";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { TooltipModule } from "primeng/tooltip";
import { UpgradeImpactInputComponent } from "../../upgrade-impact/upgrade-impact-input/upgrade-impact-input.component";
import {
  Attachment,
  AttachmentService,
  AttachmentUploaderComponent,
} from "@mxflow/features/attachment";
import { catchError, finalize, forkJoin, map, of, tap, throwError } from "rxjs";
import { ValidationScope } from "@mxflow/features/validation-management";
import { CreateBinaryImpactResponse } from "../create-binary-impact-response.model";
import { ClientImpactNoteSingleSelectDropdownComponent } from "../../client-impact-note/client-impact-note-single-select-dropdown/client-impact-note-single-select-dropdown.component";
import { ClientImpactNoteMultiSelectDropdownComponent } from "../../client-impact-note/client-impact-note-multiselect-dropdown/client-impact-note-multiselect-dropdown.component";
import { ClientImpactNoteFieldType } from "@mxevolve/domains/test/data-access";
import { IncidentInputComponent } from "@mxflow/features/incident-management";

@Component({
  selector: "mxevolve-create-binary-impact-modal",
  providers: [BinaryImpactService, AttachmentService],
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    MandatoryFieldModule,
    TooltipModule,
    ReactiveFormsModule,
    QuillEditorComponent,
    UpgradeImpactInputComponent,
    AttachmentUploaderComponent,
    ClientImpactNoteSingleSelectDropdownComponent,
    ClientImpactNoteMultiSelectDropdownComponent,
    IncidentInputComponent,
  ],
  templateUrl: "./create-binary-impact-modal.component.html",
})
export class CreateBinaryImpactModalComponent {
  private toastMessageService = inject(ToastMessageService);
  private attachmentService = inject(AttachmentService);
  private binaryImpactsService = inject(BinaryImpactService);

  private _isVisible = false;
  attachments: Attachment[] = [];
  createBinaryImpactForm: FormGroup<CreateBinaryImpactForm>;
  isLoading = false;
  private isBinaryImpactCreated = false;
  readonly uploadingAttachmentsCount = new Int32Array(1);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) correlationId: string;
  @Input() validationScope?: ValidationScope;
  @Input() initialValidationScope?: ValidationScope;
  @Input() warningMessage?: string;
  @Input({ required: true }) mxVersionInitialValue: string;
  @Input({ required: true })
  set isVisible(value: boolean) {
    this._isVisible = value;
    if (this.mxVersionInitialValue) {
      this.createBinaryImpactForm.controls.mxVersion.setValue(
        this.mxVersionInitialValue
      );
    }
  }
  get isVisible(): boolean {
    return this._isVisible;
  }
  private _submitCreationButtonLabel: string;
  @Input()
  set submitCreationButtonLabel(submitCreationButtonLabel: string | undefined) {
    this._submitCreationButtonLabel = submitCreationButtonLabel ?? "Create";
  }
  get submitCreationButtonLabel(): string {
    return this._submitCreationButtonLabel;
  }

  @Output() binaryImpactCreated =
    new EventEmitter<CreateBinaryImpactResponse>();
  @Output() createBinaryImpactCancelled = new EventEmitter<void>();

  constructor() {
    this.createBinaryImpactForm = new FormGroup<CreateBinaryImpactForm>({
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
      upgradeImpactId: new FormControl<string | null>(null, [
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      incidentId: new FormControl<string | null>(null, [
        Validators.maxLength(255),
        WhitespaceValidators.notBlank(),
      ]),
      identificationPattern: new FormControl<string | null>(null),
      propagationPattern: new FormControl<string | null>(null),
      propagationQuery: new FormControl<string | null>(null),
      configurationDesign: new FormControl<string | null>(null),
      magnitude: new FormControl<string | null>(null),
      resolutionType: new FormControl<string | null>(null, [
        Validators.required,
      ]),
      impactedOutputs: new FormControl<string | null>(null),
      sourceType: new FormControl<string | null>(null, [Validators.required]),
      stream: new FormControl<string | null>(null, [Validators.required]),
      region: new FormControl<string | null>(null, [Validators.required]),
      cbpmL1L2L3: new FormControl<string[] | null>(null, [Validators.required]),
      cbpmL2Scope: new FormControl<string[] | null>(null, [
        Validators.required,
      ]),
      cbpmL3L4: new FormControl<string[] | null>(null),
    });
  }

  onFormSubmission() {
    const formValues = this.createBinaryImpactForm.value;
    const request: CreateBinaryImpactRequest = {
      title: formValues.title as string,
      description: formValues.description as string,
      mxVersion: formValues.mxVersion as string,
      upgradeImpactId: formValues.upgradeImpactId ?? undefined,
      incidentId: formValues.incidentId ?? undefined,
      attachmentIds: this.attachments.map(
        (attachment) => attachment.attachmentId
      ),
      correlationId: this.correlationId,
      identificationPattern: formValues.identificationPattern ?? undefined,
      propagationPattern: formValues.propagationPattern ?? undefined,
      propagationQuery: formValues.propagationQuery ?? undefined,
      configurationDesign: formValues.configurationDesign ?? undefined,
      magnitude: formValues.magnitude ?? undefined,
      resolutionType: formValues.resolutionType as string,
      impactedOutputs: formValues.impactedOutputs ?? undefined,
      sourceType: formValues.sourceType as string,
      stream: formValues.stream as string,
      region: formValues.region as string,
      cbpmL1L2L3: formValues.cbpmL1L2L3 as string[],
      cbpmL2Scope: formValues.cbpmL2Scope as string[],
      cbpmL3L4: formValues.cbpmL3L4 ?? undefined,
    };
    this.onSubmitCreateBinaryImpact(request);
  }

  onCancel() {
    this.createBinaryImpactForm.reset();
    if (!this.isBinaryImpactCreated) {
      this.isVisible = false;
      this.createBinaryImpactCancelled.emit();
    } else {
      this.isBinaryImpactCreated = false;
    }
  }

  handleErrorOccured(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  upload = (file: File) => {
    this.incrementUploadingAttachmentCount();
    return this.attachmentService
      .uploadTemporaryAttachment(this.projectId, file)
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
          this.handleErrorOccured(
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
          }
        })
      )
    );
    forkJoin(filesUploadObservables).subscribe();
  }

  private addUploadedAttachmentToAttachmentList(
    response: {
      downloadLink: string;
      attachmentId: string;
    },
    file: File
  ) {
    this.attachments = [
      ...this.attachments,
      {
        downloadLink: response.downloadLink,
        attachmentId: response.attachmentId,
        name: file.name,
        type: file.type,
      },
    ];
  }

  incrementUploadingAttachmentCount() {
    Atomics.add(this.uploadingAttachmentsCount, 0, 1);
  }

  decrementUploadingAttachmentCount() {
    Atomics.sub(this.uploadingAttachmentsCount, 0, 1);
  }

  private onSubmitCreateBinaryImpact(request: CreateBinaryImpactRequest) {
    this.isLoading = true;
    this.binaryImpactsService
      .createBinaryImpact(this.projectId, request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.toastMessageService.showSuccess(
            `The Binary Impact ${request.title} was created successfully.`
          );
          this.isBinaryImpactCreated = true;
          this.binaryImpactCreated.emit(response);
        },
        error: (error) => {
          this.handleErrorOccured(error.message);
        },
      });
  }

  protected readonly ClientImpactNoteFieldType = ClientImpactNoteFieldType;
}

export interface CreateBinaryImpactForm {
  title: AbstractControl<string | null>;
  description: AbstractControl<string | null>;
  mxVersion: AbstractControl<string | null>;
  upgradeImpactId: AbstractControl<string | null>;
  incidentId: AbstractControl<string | null>;
  identificationPattern: AbstractControl<string | null>;
  propagationPattern: AbstractControl<string | null>;
  propagationQuery: AbstractControl<string | null>;
  configurationDesign: AbstractControl<string | null>;
  magnitude: AbstractControl<string | null>;
  resolutionType: AbstractControl<string | null>;
  impactedOutputs: AbstractControl<string | null>;
  sourceType: AbstractControl<string | null>;
  stream: AbstractControl<string | null>;
  region: AbstractControl<string | null>;
  cbpmL1L2L3: AbstractControl<string[] | null>;
  cbpmL2Scope: AbstractControl<string[] | null>;
  cbpmL3L4: AbstractControl<string[] | null>;
}
