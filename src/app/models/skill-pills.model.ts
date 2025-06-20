// Pill color interface for individual color properties
export interface PillColors {
  background: string;
  text: string;
  border: string;
}

// Individual scheme interface
export interface PillColorScheme {
  name: string;
  colors: PillColors;
}

// Dictionary of color schemes
export interface PillColorSchemes {
  [key: string]: PillColorScheme;
}
