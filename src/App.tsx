import { AppBar, Stack, Toolbar } from '@mui/material';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CustomMuiThemeProvider from './theme/CustomMuiThemeProvider';
import DropZone from './components/DropZone';
import ThemeModeSelector from './components/ThemeModeSelector';

export default function App() {
  return (
    <CustomMuiThemeProvider>
      <AppBar position="static" color="primary">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Image Optimizer
            </Typography>
            <Stack direction="row" spacing={2}>
              <ThemeModeSelector />
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Container maxWidth="lg">
        <DropZone />
      </Container>
    </CustomMuiThemeProvider>
  );
}
