import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { catchError, Observable, of, tap } from "rxjs";
import { UpgradeImpactDataService } from "../upgrade-impact-data.service";
import { UpgradeImpact } from "../model/upgrade-impact.model";
import { QuillEditorComponent } from "@mxflow/ui/editor";
import { FormsModule } from "@angular/forms";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { AttachmentListComponent } from "@mxflow/features/attachment";
import { UpgradeImpactAttachmentTransformationPipe } from "./upgrade-impact-attachment-transformation-pipe";

@Component({
  selector: "mxevolve-upgrade-impact-details",
  imports: [
    CommonModule,
    QuillEditorComponent,
    FormsModule,
    SkeletonModule,
    TooltipModule,
    AttachmentListComponent,
    UpgradeImpactAttachmentTransformationPipe,
  ],
  templateUrl: "./upgrade-impact-details.component.html",
  providers: [
    UpgradeImpactDataService,
    UpgradeImpactAttachmentTransformationPipe,
  ],
})
export class UpgradeImpactDetailsComponent {
  private readonly upgradeImpactDataService = inject(UpgradeImpactDataService);

  upgradeImpact$: Observable<UpgradeImpact>;
  private _upgradeImpactId: string;

  @Input({ required: true })
  set upgradeImpactId(value: string | undefined) {
    if (value) {
      this._upgradeImpactId = value;
      this.fetchUpgradeImpact();
    }
  }

  get upgradeImpactId(): string {
    return this._upgradeImpactId;
  }

  @Output() upgradeImpact: EventEmitter<UpgradeImpact> =
    new EventEmitter<UpgradeImpact>();

  @Output() errorMessage: EventEmitter<string> = new EventEmitter<string>();

  private fetchUpgradeImpact() {
    this.upgradeImpact$ = this.upgradeImpactDataService
      .fetchById(this.upgradeImpactId)
      .pipe(
        tap((upgradeImpact) => {
          this.upgradeImpact.emit(upgradeImpact);
        }),
        catchError((error) => {
          this.errorMessage.emit(error.message);
          return of(error);
        })
      );
  }
}
