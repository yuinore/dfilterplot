import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useMemo, useState, useRef } from 'react';
import { Header } from './components/Header';
import { ComplexPlane } from './components/ComplexPlane';
import { Toolbar } from './components/Toolbar';
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

  // ID カウンター
  const nextIdRef = useRef(1);
  const getNextId = () => {
    const id = nextIdRef.current.toString();
    nextIdRef.current += 1;
    return id;
  };

  // 初期の極と零点（デモ用）
  const [poles, setPoles] = useState<PoleZero[]>(() => {
    const id1 = getNextId();
    const id2 = getNextId();
    return [
      { id: id1, real: 0.5, imag: 0.5, isPole: true, pairId: id2 },
      { id: id2, real: 0.5, imag: -0.5, isPole: true, pairId: id1, isConjugate: true },
    ];
  });

  const [zeros, setZeros] = useState<PoleZero[]>(() => [
    { id: getNextId(), real: -0.3, imag: 0, isPole: false },
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

  // 極を追加（実軸上に配置）
  const handleAddPole = () => {
    const newId = getNextId();
    const newPole: PoleZero = {
      id: newId,
      real: 0.7,
      imag: 0,
      isPole: true,
    };
    setPoles((prev) => [...prev, newPole]);
  };

  // 零点を追加（実軸上に配置）
  const handleAddZero = () => {
    const newId = getNextId();
    const newZero: PoleZero = {
      id: newId,
      real: -0.7,
      imag: 0,
      isPole: false,
    };
    setZeros((prev) => [...prev, newZero]);
  };

  // 極を削除（複素共役ペアも削除）
  const handleDeletePole = (id: string) => {
    setPoles((prev) => {
      const pole = prev.find((p) => p.id === id);
      if (!pole) return prev;
      
      // 複素共役ペアがある場合、ペアも削除
      if (pole.pairId) {
        return prev.filter((p) => p.id !== id && p.id !== pole.pairId);
      }
      
      return prev.filter((p) => p.id !== id);
    });
  };

  // 零点を削除（複素共役ペアも削除）
  const handleDeleteZero = (id: string) => {
    setZeros((prev) => {
      const zero = prev.find((z) => z.id === id);
      if (!zero) return prev;
      
      // 複素共役ペアがある場合、ペアも削除
      if (zero.pairId) {
        return prev.filter((z) => z.id !== id && z.id !== zero.pairId);
      }
      
      return prev.filter((z) => z.id !== id);
    });
  };

  // すべてクリア
  const handleClear = () => {
    setPoles([]);
    setZeros([]);
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
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ComplexPlane 
              poles={poles} 
              zeros={zeros}
              onPoleMove={handlePoleMove}
              onZeroMove={handleZeroMove}
            />
            <Toolbar
              poles={poles}
              zeros={zeros}
              onAddPole={handleAddPole}
              onAddZero={handleAddZero}
              onDeletePole={handleDeletePole}
              onDeleteZero={handleDeleteZero}
              onClear={handleClear}
            />
          </Box>
          <Box sx={{ flex: 1 }}>Bode Plot (Coming soon)</Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
