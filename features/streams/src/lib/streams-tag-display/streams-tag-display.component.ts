import { Component, Input, NgModule, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Stream } from "../stream";
import { StreamsService } from "../streams.service";
import { Store } from "@ngrx/store";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { concatMap, Subject, takeUntil } from "rxjs";
import { TagModule } from "primeng/tag";
import { MandatoryModule } from "@mxflow/directive";
import { SkeletonModule } from "primeng/skeleton";

@Component({
  selector: "mxevolve-streams-tag-display",
  template: `
    <div class="field">
      @if (isFormLoading || isLoadingStreams) {
      <p-skeleton styleClass="h-12"></p-skeleton>
      } @if (!isFormLoading && !isLoadingStreams && !failedToFetchStreams) {
      <div>
        @if (listOfSelectedStreams.length === 0) {
        <em> Please select a BPC first </em>
        } @if (listOfSelectedStreams.length > 0) {
        <div>
          @for (item of listOfSelectedStreams; track item) {
          <p-tag class="mr-1">{{ item.name }}</p-tag>
          }
        </div>
        }
      </div>
      } @if (failedToFetchStreams) {
      <div>
        <em>Failed to load Streams. Please try to refresh the page</em>
      </div>
      }
    </div>
  `,
  standalone: false,
})
export class StreamsTagDisplayComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();
  private _bpcIds: string[] = [];
  get bpcIds(): string[] {
    return this._bpcIds;
  }

  @Input() set bpcIds(value: string[]) {
    this._bpcIds = value;
    this.updateSelectedStreams();
  }

  @Input() isFormLoading = false;

  listOfSelectedStreams: Stream[] = [];
  isLoadingStreams = true;
  failedToFetchStreams = false;
  private _listOfAllStreams: Stream[] = [];
  get listOfAllStreams(): Stream[] {
    return this._listOfAllStreams;
  }

  set listOfAllStreams(value: Stream[]) {
    this._listOfAllStreams = value;
    this.updateSelectedStreams();
  }

  constructor(private streamService: StreamsService, private store: Store) {}

  ngOnInit() {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        takeUntil(this.destroy$),
        concatMap((projectId) => this.streamService.getStreams(projectId))
      )
      .subscribe({
        next: (streams) => {
          this.listOfAllStreams = streams;
          this.isLoadingStreams = false;
        },
        error: () => {
          this.isLoadingStreams = false;
          this.failedToFetchStreams = true;
        },
      });
  }

  private updateSelectedStreams() {
    this.listOfSelectedStreams = this.listOfAllStreams.filter((stream) => {
      return (
        stream.businessProcessChains.findIndex((bpc) =>
          this.bpcIds?.includes(bpc.id)
        ) > -1
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}

@NgModule({
  imports: [CommonModule, TagModule, MandatoryModule, SkeletonModule],
  declarations: [StreamsTagDisplayComponent],
  exports: [StreamsTagDisplayComponent],
  providers: [StreamsService],
})
export class StreamsTagDisplayModule {}
