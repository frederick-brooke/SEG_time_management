interface Task {
  id: string;
  title: string;
  duration: number;
  dueDate: Date | null;
  bufferDays: number | null;
  priority: string;
}

interface Event {
  start: Date;
  end: Date;
}

interface UserPreferences {
  workStartTime: string; // "09:00"
  workEndTime: string; // "18:00"
  daysOff: string[]; // ["Sat", "Sun"]
  sessionLength: int; // minutes before a break
  breakLength: number; // minutes
  taskOrder: string; // "priority" | "duration_asc" | "duration_desc" | "deadline"
}

interface ScheduledTask {
  taskId: string;
  scheduledDate: Date;
  scheduledTime: Date;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseTime(timeStr: string, date: Date): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function sortTasks(tasks: Task[], taskOrder: string): Task[] {
  const priorityMap: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
  return [...tasks].sort((a, b) => {
    switch (taskOrder) {
      case "priority":
        return priorityMap[b.priority] - priorityMap[a.priority];
      case "duration_asc":
        return a.duration - b.duration;
      case "duration_desc":
        return b.duration - a.duration;
      case "deadline":
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      default:
        return priorityMap[b.priority] - priorityMap[a.priority];
    }
  });
}

export function scheduleTasks(
  tasks: Task[],
  events: Event[],
  preferences: UserPreferences,
  days: Date[], // the days to schedule across
): ScheduledTask[] {
  const results: ScheduledTask[] = [];
  const sorted = sortTasks(tasks, preferences.taskOrder);

  for (const task of sorted) {
    // compute deadline considering bufferDays
    let effectiveDeadline: Date | null = null;
    if (task.dueDate) {
      effectiveDeadline = new Date(task.dueDate);
      if (task.bufferDays) {
        effectiveDeadline.setDate(
          effectiveDeadline.getDate() - task.bufferDays,
        );
      }
    }

    let scheduled = false;

    for (const day of days) {
      const dayName = DAY_NAMES[day.getDay()];

      // skip days off
      if (preferences.daysOff.includes(dayName)) continue;

      // skip if past effective deadline
      if (effectiveDeadline && day > effectiveDeadline) continue;

      // get work window for this day
      const workStart = parseTime(preferences.workStartTime, day);
      const workEnd = parseTime(preferences.workEndTime, day);

      // get events on this day
      const dayEvents = events
        .filter((e) => {
          const eDate = new Date(e.start);
          return eDate.toDateString() === day.toDateString();
        })
        .sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        );

      // get already scheduled tasks on this day (from results so far)
      const scheduledOnDay = results
        .filter((r) => r.scheduledDate.toDateString() === day.toDateString())
        .map((r) => ({
          start: r.scheduledTime,
          end: new Date(
            r.scheduledTime.getTime() +
              (sorted.find((t) => t.id === r.taskId)?.duration || 60) * 60000,
          ),
        }));

      // combine blocked slots
      const blocked = [...dayEvents, ...scheduledOnDay]
        .map((e) => ({ start: new Date(e.start), end: new Date(e.end) }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

      // find free slots
      const freeSlots: { start: Date; end: Date }[] = [];
      let cursor = new Date(workStart);
      let sessionMinutes = 0;

      for (const block of blocked) {
        if (cursor < block.start) {
          freeSlots.push({
            start: new Date(cursor),
            end: new Date(block.start),
          });
        }
        if (block.end > cursor) cursor = new Date(block.end);
      }
      if (cursor < workEnd) {
        freeSlots.push({ start: new Date(cursor), end: new Date(workEnd) });
      }

      // try to fit task into a free slot respecting session/break lengths
      const taskDurationMs = task.duration * 60000;
      const sessionMs = preferences.sessionLength * 60000;
      const breakMs = preferences.breakLength * 60000;

      for (const slot of freeSlots) {
        const slotDuration = slot.end.getTime() - slot.start.getTime();

        // account for break if session length exceeded
        const neededMs =
          sessionMinutes * 60000 >= sessionMs
            ? breakMs + taskDurationMs
            : taskDurationMs;

        if (slotDuration >= neededMs) {
          const startTime =
            sessionMinutes * 60000 >= sessionMs
              ? new Date(slot.start.getTime() + breakMs)
              : new Date(slot.start);

          results.push({
            taskId: task.id,
            scheduledDate: new Date(day.setHours(0, 0, 0, 0)),
            scheduledTime: startTime,
          });

          sessionMinutes += task.duration;
          scheduled = true;
          break;
        }
      }

      if (scheduled) break;
    }

    // if not scheduled within buffer, try after buffer but before hard deadline
    if (!scheduled && task.dueDate) {
      const hardDeadline = new Date(task.dueDate);
      const remainingDays = days.filter(
        (d) => effectiveDeadline && d > effectiveDeadline && d <= hardDeadline,
      );

      for (const day of remainingDays) {
        const dayName = DAY_NAMES[day.getDay()];
        if (preferences.daysOff.includes(dayName)) continue;

        results.push({
          taskId: task.id,
          scheduledDate: new Date(new Date(day).setHours(0, 0, 0, 0)),
          scheduledTime: parseTime(preferences.workStartTime, day),
        });
        scheduled = true;
        break;
      }
    }

    // mark as needs warning if past hard deadline
    if (!scheduled) {
      results.push({
        taskId: task.id,
        scheduledDate: new Date(0), // sentinel value = needs warning
        scheduledTime: new Date(0),
      });
    }
  }

  return results;
}
