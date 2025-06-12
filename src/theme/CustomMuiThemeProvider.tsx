import { CssBaseline, PaletteMode, ThemeProvider } from '@mui/material';
import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { getBaseTheme } from './mui-theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ColorModeContextType {
  mode: ThemeMode;
  actualMode: PaletteMode;
  setMode: (mode: ThemeMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'system',
  actualMode: 'light',
  setMode: () => {},
});

export const CustomMuiThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('system');

  // Determine actual mode based on system if needed
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const actualMode = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

  const theme = useMemo(() => getBaseTheme(actualMode), [actualMode]);

  return (
    <ColorModeContext.Provider value={{ mode, actualMode, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export const useThemeToggle = () => useContext(ColorModeContext);
export default CustomMuiThemeProvider;
