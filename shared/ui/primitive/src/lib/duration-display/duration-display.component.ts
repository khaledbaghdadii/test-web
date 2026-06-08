import { Component, computed, input } from "@angular/core";

@Component({
  selector: "mxevolve-duration-display",
  template: `{{ formattedDuration() }}`,
})
export class DurationDisplayComponent {
  startDate = input<string | undefined>(undefined);
  endDate = input<string | undefined>(undefined);

  formattedDuration = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) {
      return "-";
    }

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (isNaN(startTime) || isNaN(endTime)) {
      return "-";
    }

    const durationMilliseconds = endTime - startTime;

    if (durationMilliseconds < 0) {
      return "-";
    }

    const totalSeconds = Math.floor(durationMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}h ${minutes}m ${seconds}s`;
  });
}
