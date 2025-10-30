
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

export type TimegrapherReadingData = {
  customerName: string;
  refNumber: string;
  position: Position;
  rate: string;
  amplitude: string;
  beatError: string;
  liftAngle: string;
};

export type TimegrapherReading = {
  id: string;
  timestamp: Date;
} & TimegrapherReadingData;

export type AnalyzedImage = {
  imageUrl: string;
  data: TimegrapherReadingData;
};
