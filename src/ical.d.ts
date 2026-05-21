declare module 'ical.js' {
  const ICAL: {
    parse(input: string): unknown;
    Component: typeof Component;
    Event: typeof Event;
    RecurExpansion: typeof RecurExpansion;
  };
  export default ICAL;

  export class Component {
    constructor(jCal: unknown);
    getFirstProperty(name: string): Property | null;
    getAllSubcomponents(name: string): Component[];
  }

  export interface OccurrenceDetails {
    startDate: Time;
    endDate: Time;
    item: Event;
    recurrenceId?: Time;
  }

  export class Event {
    constructor(component: Component);
    component: Component;
    startDate: Time | null;
    endDate: Time | null;
    summary: string | null;
    uid: string | null;
    status: string | null;
    isRecurring(): boolean;
    isRecurrenceException(): boolean;
    iterator(startTime?: Time): RecurExpansion;
    getOccurrenceDetails(occurrence: Time): OccurrenceDetails;
  }

  export class RecurExpansion {
    next(): Time | null;
  }

  export class Time {
    zone?: { tzid?: string };
    toJSDate(): Date;
  }

  export class Property {
    getFirstValue(): unknown;
  }
}
