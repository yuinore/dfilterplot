import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ComplexPlane } from './components/ComplexPlane';
import type { PoleZero } from './types';

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
    { id: '1', real: 0.5, imag: 0.5, isPole: true, pairId: '2' },
    { id: '2', real: 0.5, imag: -0.5, isPole: true, pairId: '1', isConjugate: true },
  ]);

  const [zeros, setZeros] = useState<PoleZero[]>([
    { id: '3', real: -0.3, imag: 0, isPole: false },
  ]);

  // 極の移動処理（複素共役ペアを自動更新）
  const handlePoleMove = (id: string, real: number, imag: number) => {
    setPoles((prevPoles) => {
      return prevPoles.map((pole) => {
        if (pole.id === id) {
          const updatedPole = { ...pole, real, imag };
          // 複素共役ペアがあれば、ペアも更新
          if (pole.pairId) {
            return updatedPole;
          }
          return updatedPole;
        }
        // このポールが移動したポールのペアの場合、複素共役を更新
        if (pole.pairId === id) {
          const movingPole = prevPoles.find((p) => p.id === id);
          if (movingPole) {
            return { ...pole, real, imag: -imag };
          }
        }
        return pole;
      });
    });
  };

  // 零点の移動処理（複素共役ペアを自動更新）
  const handleZeroMove = (id: string, real: number, imag: number) => {
    setZeros((prevZeros) => {
      return prevZeros.map((zero) => {
        if (zero.id === id) {
          const updatedZero = { ...zero, real, imag };
          // 複素共役ペアがあれば、ペアも更新
          if (zero.pairId) {
            return updatedZero;
          }
          return updatedZero;
        }
        // このゼロが移動したゼロのペアの場合、複素共役を更新
        if (zero.pairId === id) {
          const movingZero = prevZeros.find((z) => z.id === id);
          if (movingZero) {
            return { ...zero, real, imag: -imag };
          }
        }
        return zero;
      });
    });
  };

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
            <ComplexPlane 
              poles={poles} 
              zeros={zeros}
              onPoleMove={handlePoleMove}
              onZeroMove={handleZeroMove}
            />
          </Box>
          <Box sx={{ flex: 1 }}>Bode Plot (Coming soon)</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
