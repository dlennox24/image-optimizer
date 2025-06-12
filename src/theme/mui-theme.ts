import { alpha, createTheme } from '@mui/material/styles';

export const getBaseTheme = (mode: 'light' | 'dark') => {
  const base = createTheme({
    palette: {
      mode,
    },
  });

  const augmentedBackground = base.palette.augmentColor({
    color: { main: base.palette.background.default },
    name: 'customBackground',
  });

  return createTheme(base, {
    palette: {
      background: {
        default: mode === 'dark' ? '#0c0c0c' : '#f5f5f5',
      },
    },
    components: {
      MuiChip: {
        styleOverrides: {
          colorDefault: {
            background: alpha(base.palette.divider, 0.025),
          },
          colorInfo: {
            background: alpha(base.palette.info.main, 0.1),
          },
          colorError: {
            background: alpha(base.palette.error.main, 0.1),
          },
          colorWarning: {
            background: alpha(base.palette.warning.main, 0.1),
          },
          colorSuccess: {
            background: alpha(base.palette.success.main, 0.1),
          },
        },
      },
    },
  });
};
