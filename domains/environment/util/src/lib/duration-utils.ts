import { DateTime, Duration } from "luxon";

export class DurationUtils {
  static formatDate(date: Date): string {
    return DateTime.fromJSDate(date).toLocaleString({
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }

  static parseDurationToSeconds(duration: string): number {
    return Duration.fromISO(duration).as("seconds");
  }

  static parseDurationToMinutes(duration: string): string {
    return Duration.fromISO(duration)
      .shiftTo("minutes", "seconds")
      .toHuman({ showZeros: false });
  }

  static convertSecondsToDurationString(seconds: number): string {
    const duration = Duration.fromObject({ seconds }).shiftTo(
      "hours",
      "minutes",
      "seconds"
    );
    const human = duration.toHuman({ showZeros: false });
    return human || "0 seconds";
  }
}
