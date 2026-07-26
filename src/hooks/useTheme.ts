import { useContext } from 'react';
import { ThemeContext } from './themeContext';

// Only exports a hook → Fast Refresh happy ✓
export function useTheme() {
  return useContext(ThemeContext);
}
