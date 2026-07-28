import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ChipModule } from "primeng/chip";
import { TableModule } from "primeng/table";
import { PatternDetailsService } from "./pattern-details.service";
import { PatternDetails } from "./pattern-details.model";
@Component({
  selector: "mxevolve-pattern-details",
  templateUrl: "./pattern-details.component.html",
  styleUrls: ["./pattern-details.component.scss"],
  standalone: true,
  providers: [PatternDetailsService],
  imports: [ChipModule, TableModule],
})
export class PatternDetailsComponent implements OnInit, OnChanges {
  @Input() patternInstanceId?: string;
  @Input() projectId?: string;
  @Output() detailsLoaded = new EventEmitter<PatternDetails>();
  @Output() rootCauseClicked = new EventEmitter<number>();
  @Output() loadError = new EventEmitter<unknown>();

  patternDetails: PatternDetails | null = null;
  loading = false;

  private readonly service = inject(PatternDetailsService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    if (!this.patternInstanceId) {
      const routeInstanceId =
        this.route.snapshot.params["patternInstanceId"] ??
        this.route.snapshot.params["id"];
      if (routeInstanceId) {
        this.patternInstanceId = routeInstanceId;
        this.loadDetails();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes["patternInstanceId"] || changes["projectId"]) &&
      this.patternInstanceId
    ) {
      this.loadDetails();
    }
  }

  private loadDetails(): void {
    const projectId = this.projectId || this.route.snapshot.params["projectId"];
    if (this.patternInstanceId) {
      this.patternDetails = null;
      this.loading = true;
      this.service
        .getPatternDetailsByPatternInstanceId(this.patternInstanceId, projectId)
        .subscribe({
          next: (details) => {
            this.patternDetails = details;
            this.loading = false;
            this.detailsLoaded.emit(details);
          },
          error: (err) => {
            this.loading = false;
            this.loadError.emit(err);
          },
        });
    }
  }

  onRootCauseClick(rootCauseId: number): void {
    this.rootCauseClicked.emit(rootCauseId);
  }

  onRootCauseChipKeyDown(event: KeyboardEvent, rootCauseId: number): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.onRootCauseClick(rootCauseId);
    }
  }
}
