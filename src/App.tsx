import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ComplexPlane } from './components/ComplexPlane';
import { PoleZero } from './types';

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

  // 初期の極と零点（デモ用）
  const [poles, setPoles] = useState<PoleZero[]>([
    { id: '1', real: 0.5, imag: 0.5, isPole: true },
    { id: '2', real: 0.5, imag: -0.5, isPole: true },
  ]);

  const [zeros, setZeros] = useState<PoleZero[]>([
    { id: '3', real: -0.3, imag: 0, isPole: false },
  ]);

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
          <Box sx={{ flex: 1 }}>
            <ComplexPlane poles={poles} zeros={zeros} />
          </Box>
          <Box sx={{ flex: 1 }}>Bode Plot (Coming soon)</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
