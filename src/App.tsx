import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useMemo } from 'react';
import { Header } from './components/Header';

function App() {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
        },
      }),
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            display: 'flex',
            gap: 3,
            overflow: 'auto',
          }}
        >
          {/* Complex Plane and Bode Plot will go here */}
          <Box sx={{ flex: 1 }}>Complex Plane (Coming soon)</Box>
          <Box sx={{ flex: 1 }}>Bode Plot (Coming soon)</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
