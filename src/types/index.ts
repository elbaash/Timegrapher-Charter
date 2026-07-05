
export const POSITIONS = [
  'Dial Up',
  'Dial Down',
  'Crown Up',
  'Crown Down',
  'Crown Left',
  'Crown Right',
  'Unknown'
] as const;

export type Position = typeof POSITIONS[number];

// Raw data from timegrapher, without session-specific info
export type TimegrapherData = {
  position: Position;
  rate: string;
  amplitude: string;
  beatError: string;
  liftAngle: string;
}

// Data used for manual entry forms, allows optional fields during input
export type TimegrapherReadingData = {
  customerName?: string;
  refNumber?: string;
} & TimegrapherData;


export type TimegrapherReading = {
  id: string;
  timestamp: Date | string;
} & TimegrapherData;

export type AnalyzedImage = {
  imageUrl: string;
  data: TimegrapherReadingData;
};

// Legacy flat archive shape — kept for one-time migration into the watch model (see watch-store.ts).
export type CustomerSession = {
  id: string;
  customerName: string;
  refNumber: string;
  createdAt: string | Date;
  readings: TimegrapherReading[];
}

// A single dated capture pass — one set of position readings taken at one time.
export type ReadingsTable = {
  id: string;
  createdAt: string | Date;
  readings: TimegrapherReading[];
}

// A named watch the user tracks over time: owns a chronological history of readings tables.
// This is the top-level archive entity (the "look back on" / before-after unit).
export type Watch = {
  id: string;
  name: string;
  refNumber: string;
  createdAt: string | Date;
  tables: ReadingsTable[];
}
