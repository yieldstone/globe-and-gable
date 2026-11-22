export const SQ_FT_PER_M2 = 10.76391041671;

export const toSquareFeet = (m2: number) => m2 * SQ_FT_PER_M2;
export const toSquareMeters = (sqFt: number) => sqFt / SQ_FT_PER_M2;
export const formatArea = (m2: number) => `${Math.round(toSquareFeet(m2)).toLocaleString("en-US")} sq ft`;