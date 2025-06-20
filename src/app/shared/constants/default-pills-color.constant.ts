import { PillColorSchemes } from '../../models';

// Add these color schemes near the top of your component
export const PILL_COLOR_SCHEMES: PillColorSchemes = {
  professional: {
    name: 'Professional',
    colors: {
      background: '#f0f9ff', // Light sky blue background
      text: '#0c4a6e', // Dark navy text
      border: '#bae6fd', // Light blue border
    },
  },
  modern: {
    name: 'Modern',
    colors: {
      background: '#f5f5f5', // Light gray background
      text: '#1a1a1a', // Nearly black text
      border: '#e0e0e0', // Medium gray border
    },
  },
  vibrant: {
    name: 'Vibrant',
    colors: {
      background: '#fdf2f8', // Light pink background
      text: '#831843', // Deep pink text
      border: '#fbcfe8', // Soft pink border
    },
  },
  nature: {
    name: 'Nature',
    colors: {
      background: '#f0fdf4', // Light mint background
      text: '#166534', // Forest green text
      border: '#bbf7d0', // Soft green border
    },
  },
  warm: {
    name: 'Warm',
    colors: {
      background: '#fff7ed', // Light orange background
      text: '#9a3412', // Rust text
      border: '#fed7aa', // Soft orange border
    },
  },
};
