import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { CommonModule, DatePipe } from "@angular/common";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { BinaryImpact } from "../binary-impact";
import { BinaryImpactService } from "../binary-impact.service";
import { Subject } from "rxjs";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { FormsModule } from "@angular/forms";
import { UpgradeImpactDetailsComponent } from "../../upgrade-impact";
import { UpgradeImpact } from "../../upgrade-impact/model/upgrade-impact.model";
import { MessageModule } from "primeng/message";
import { DividerModule } from "primeng/divider";
import { AttachmentListComponent } from "@mxflow/features/attachment";
import { ToastMessageService } from "@mxflow/ui/alert";
import { DisplayClientImpactNoteListFieldPipe } from "./client-impact-note-field-list-display-pipe/client-impact-note-field-list-display.pipe";
import { IncidentExternalLinkPipe } from "@mxflow/features/incident-management";

@Component({
  selector: "mxevolve-binary-impact-details",
  imports: [
    DatePipe,
    CommonModule,
    SkeletonModule,
    TagModule,
    QuillEditorComponent,
    FormsModule,
    UpgradeImpactDetailsComponent,
    DividerModule,
    MessageModule,
    AttachmentListComponent,
    DisplayClientImpactNoteListFieldPipe,
    IncidentExternalLinkPipe,
  ],
  providers: [BinaryImpactService],
  templateUrl: "./binary-impact-details.component.html",
})
export class BinaryImpactDetailsComponent implements OnInit, OnDestroy {
  private readonly binaryImpactService = inject(BinaryImpactService);
  private readonly toastMessageService = inject(ToastMessageService);

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) binaryImpactId: string;
  @Input({ required: true }) projectName: string;
  @Output() errorMessageEmitter = new EventEmitter<string>();

  isLoading = false;
  binaryImpact?: BinaryImpact;
  upgradeImpact?: UpgradeImpact;
  private readonly destroy$ = new Subject();

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.fetchBinaryImpactDetails();
  }

  fetchBinaryImpactDetails() {
    this.binaryImpactService
      .getById(this.projectId, this.binaryImpactId)
      .subscribe({
        next: (binaryImpact) => {
          this.binaryImpact = binaryImpact;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessageEmitter.emit(error);
          this.isLoading = false;
        },
      });
  }

  setUpgradeImpact(upgradeImpact: UpgradeImpact) {
    this.upgradeImpact = upgradeImpact;
  }

  handleErrorOccurredUponLoadingUpgradeImpact(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }
}
