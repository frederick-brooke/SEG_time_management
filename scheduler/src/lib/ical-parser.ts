export interface ParsedVEvent {
    uid: string;
    summary: string;
    description?: string;
    dtstart: Date;
    dtend: Date;
    allDay: boolean;
    rrule?: string;
    exdates: Date[];
  }
  
  function unfold(raw: string): string {
    return raw.replace(/\r?\n[ \t]/g, "");
  }
  
  function parseDt(value: string, params: string): { date: Date; allDay: boolean } {
    const allDay = params.includes("VALUE=DATE") || /^\d{8}$/.test(value.trim());
    const v = value.trim();
  
    if (allDay) {
      const y = +v.slice(0, 4);
      const m = +v.slice(4, 6) - 1;
      const d = +v.slice(6, 8);
      return { date: new Date(Date.UTC(y, m, d)), allDay: true };
    }
  
    const y = +v.slice(0, 4);
    const mo = +v.slice(4, 6) - 1;
    const d = +v.slice(6, 8);
    const h = +v.slice(9, 11);
    const mi = +v.slice(11, 13);
    const s = +v.slice(13, 15);
    const isUtc = v.endsWith("Z");
    const date = isUtc
      ? new Date(Date.UTC(y, mo, d, h, mi, s))
      : new Date(y, mo, d, h, mi, s);
  
    return { date, allDay: false };
  }
  
  function addDuration(start: Date, duration: string): Date {
    const result = new Date(start);
    const m = duration.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
    if (!m) return result;
    const [, weeks, days, hours, mins, secs] = m.map((v) => parseInt(v ?? "0", 10) || 0);
    result.setDate(result.getDate() + weeks * 7 + days);
    result.setHours(result.getHours() + hours);
    result.setMinutes(result.getMinutes() + mins);
    result.setSeconds(result.getSeconds() + secs);
    return result;
  }
  
  export function parseRRule(rrule: string): object | null {
    const parts: Record<string, string> = {};
    rrule.replace(/^RRULE:/i, "").split(";").forEach((p) => {
      const [k, v] = p.split("=");
      parts[k.toUpperCase()] = v;
    });
  
    const freq = parts["FREQ"]?.toLowerCase();
    if (!freq || !["daily", "weekly", "monthly"].includes(freq)) return null;
  
    const until = parts["UNTIL"]
      ? parseDt(parts["UNTIL"], "").date
      : parts["COUNT"]
      ? null
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  
    const days =
      freq === "weekly" && parts["BYDAY"]
        ? parts["BYDAY"].split(",").map((d) => {
            const map: Record<string, string> = {
              SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed",
              TH: "Thu", FR: "Fri", SA: "Sat",
            };
            return map[d.slice(-2).toUpperCase()] ?? d;
          })
        : undefined;
  
    return { type: freq, until: until ?? null, ...(days ? { days } : {}) };
  }
  
  export function parseICal(raw: string): ParsedVEvent[] {
    const text = unfold(raw);
    const lines = text.split(/\r?\n/);
    const events: ParsedVEvent[] = [];
  
    let inEvent = false;
    let cur: Partial<ParsedVEvent> & { durationRaw?: string } = {};
  
    for (const line of lines) {
      const upper = line.toUpperCase();
  
      if (upper === "BEGIN:VEVENT") {
        inEvent = true;
        cur = { exdates: [] };
        continue;
      }
  
      if (upper === "END:VEVENT") {
        inEvent = false;
        if (!cur.dtend && cur.dtstart && cur.durationRaw)
          cur.dtend = addDuration(cur.dtstart, cur.durationRaw);
        if (!cur.dtend && cur.dtstart && cur.allDay) {
          const d = new Date(cur.dtstart);
          d.setUTCDate(d.getUTCDate() + 1);
          cur.dtend = d;
        }
        if (cur.uid && cur.summary && cur.dtstart && cur.dtend)
          events.push(cur as ParsedVEvent);
        continue;
      }
  
      if (!inEvent) continue;
  
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const keyPart = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1);
      const semicolonIdx = keyPart.indexOf(";");
      const propName = (semicolonIdx === -1 ? keyPart : keyPart.slice(0, semicolonIdx)).toUpperCase();
      const params = semicolonIdx === -1 ? "" : keyPart.slice(semicolonIdx + 1).toUpperCase();
  
      switch (propName) {
        case "UID": cur.uid = value.trim(); break;
        case "SUMMARY": cur.summary = value.trim(); break;
        case "DESCRIPTION":
          cur.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").trim();
          break;
        case "DTSTART": {
          const { date, allDay } = parseDt(value, params);
          cur.dtstart = date;
          cur.allDay = allDay;
          break;
        }
        case "DTEND": {
          const { date } = parseDt(value, params);
          cur.dtend = date;
          break;
        }
        case "DURATION": cur.durationRaw = value.trim(); break;
        case "RRULE": cur.rrule = value.trim(); break;
        case "EXDATE": {
          const exVals = value.split(",");
          for (const exv of exVals) {
            const { date } = parseDt(exv.trim(), params);
            cur.exdates!.push(date);
          }
          break;
        }
      }
    }
  
    return events;
  }