export interface PoleZero {
  id: string;
  real: number;
  imag: number;
  isPole: boolean;
  isConjugate?: boolean;
  pairId?: string;
}

export interface FrequencyResponse {
  frequency: number[];
  magnitude: number[];
  phase: number[];
}
