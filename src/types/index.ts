
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

// Data used for manual entry forms, includes customer info
export type TimegrapherReadingData = {
  customerName: string;
  refNumber: string;
} & TimegrapherData;


export type TimegrapherReading = {
  id: string;
  timestamp: Date | string;
} & TimegrapherData;

export type AnalyzedImage = {
  imageUrl: string;
  data: TimegrapherReadingData; // This includes customer/ref for initial assignment
};

export type CustomerSession = {
  id: string;
  customerName: string;
  refNumber: string;
  createdAt: string | Date;
  readings: TimegrapherReading[];
}

    