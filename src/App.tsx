import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ComplexPlane } from './components/ComplexPlane';
import { Toolbar } from './components/Toolbar';
import { BodePlot } from './components/BodePlot';
import { Settings } from './components/Settings';
import { FilterDesign, type FilterType, type BiquadType } from './components/FilterDesign';
import type { PoleZero } from './types';
import {
  generateLowPassBiquad,
  generateHighPassBiquad,
  generateBandPassBiquad,
  generateBandStopBiquad,
} from './utils/biquadFilter';

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

  // 設定状態
  const [enableSnap, setEnableSnap] = useState(true);
  const [logarithmicFrequency, setLogarithmicFrequency] = useState(true);

  // フィルタ設計状態
  const [filterType, setFilterType] = useState<FilterType>('none');
  const [biquadType, setBiquadType] = useState<BiquadType>('lowpass');
  const [cutoffFrequency, setCutoffFrequency] = useState<number>(Math.PI / 4);

  // フィルタ設計が変更されたら極・零点を更新
  useEffect(() => {
    if (filterType === 'biquad') {
      let result;
      switch (biquadType) {
        case 'lowpass':
          result = generateLowPassBiquad(cutoffFrequency);
          break;
        case 'highpass':
          result = generateHighPassBiquad(cutoffFrequency);
          break;
        case 'bandpass':
          result = generateBandPassBiquad(cutoffFrequency);
          break;
        case 'bandstop':
          result = generateBandStopBiquad(cutoffFrequency);
          break;
      }
      setPoles(result.poles);
      setZeros(result.zeros);
    }
  }, [filterType, biquadType, cutoffFrequency]);

  // 極の移動処理（複素共役ペアを自動更新）
  const handlePoleMove = useCallback((id: string, real: number, imag: number) => {
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
  }, []);

  // 零点の移動処理（複素共役ペアを自動更新）
  const handleZeroMove = useCallback((id: string, real: number, imag: number) => {
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
  }, []);

  // 極ペアを追加（複素共役ペア）
  const handleAddPolePair = useCallback(() => {
    const id1 = getNextId();
    const id2 = getNextId();
    const pole1: PoleZero = {
      id: id1,
      real: 0.7,
      imag: 0.3,
      isPole: true,
      pairId: id2,
    };
    const pole2: PoleZero = {
      id: id2,
      real: 0.7,
      imag: -0.3,
      isPole: true,
      pairId: id1,
      isConjugate: true,
    };
    setPoles((prev) => [...prev, pole1, pole2]);
  }, []);

  // 極を追加（実軸上に配置）
  const handleAddPoleReal = useCallback(() => {
    const newId = getNextId();
    const newPole: PoleZero = {
      id: newId,
      real: 0.7,
      imag: 0,
      isPole: true,
    };
    setPoles((prev) => [...prev, newPole]);
  }, []);

  // 零点ペアを追加（複素共役ペア）
  const handleAddZeroPair = useCallback(() => {
    const id1 = getNextId();
    const id2 = getNextId();
    const zero1: PoleZero = {
      id: id1,
      real: -0.7,
      imag: 0.3,
      isPole: false,
      pairId: id2,
    };
    const zero2: PoleZero = {
      id: id2,
      real: -0.7,
      imag: -0.3,
      isPole: false,
      pairId: id1,
      isConjugate: true,
    };
    setZeros((prev) => [...prev, zero1, zero2]);
  }, []);

  // 零点を追加（実軸上に配置）
  const handleAddZeroReal = useCallback(() => {
    const newId = getNextId();
    const newZero: PoleZero = {
      id: newId,
      real: -0.7,
      imag: 0,
      isPole: false,
    };
    setZeros((prev) => [...prev, newZero]);
  }, []);

  // 極を削除（複素共役ペアも削除）
  const handleDeletePole = useCallback((id: string) => {
    setPoles((prev) => {
      const pole = prev.find((p) => p.id === id);
      if (!pole) return prev;
      
      // 複素共役ペアがある場合、ペアも削除
      if (pole.pairId) {
        return prev.filter((p) => p.id !== id && p.id !== pole.pairId);
      }
      
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // 零点を削除（複素共役ペアも削除）
  const handleDeleteZero = useCallback((id: string) => {
    setZeros((prev) => {
      const zero = prev.find((z) => z.id === id);
      if (!zero) return prev;
      
      // 複素共役ペアがある場合、ペアも削除
      if (zero.pairId) {
        return prev.filter((z) => z.id !== id && z.id !== zero.pairId);
      }
      
      return prev.filter((z) => z.id !== id);
    });
  }, []);

  // すべてクリア
  const handleClear = useCallback(() => {
    setPoles([]);
    setZeros([]);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: { xs: 2, md: 3 },
            overflow: 'auto',
          }}
        >
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            minWidth: { xs: '100%', lg: '400px' }
          }}>
            <ComplexPlane 
              poles={poles} 
              zeros={zeros}
              enableSnap={enableSnap}
              onPoleMove={handlePoleMove}
              onZeroMove={handleZeroMove}
            />
            <Toolbar
              poles={poles}
              zeros={zeros}
              onAddPolePair={handleAddPolePair}
              onAddPoleReal={handleAddPoleReal}
              onAddZeroPair={handleAddZeroPair}
              onAddZeroReal={handleAddZeroReal}
              onDeletePole={handleDeletePole}
              onDeleteZero={handleDeleteZero}
              onClear={handleClear}
            />
            <Settings
              enableSnap={enableSnap}
              onEnableSnapChange={setEnableSnap}
              logarithmicFrequency={logarithmicFrequency}
              onLogarithmicFrequencyChange={setLogarithmicFrequency}
            />
            <FilterDesign
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              biquadType={biquadType}
              onBiquadTypeChange={setBiquadType}
              cutoffFrequency={cutoffFrequency}
              onCutoffFrequencyChange={setCutoffFrequency}
            />
          </Box>
          <Box sx={{ 
            flex: 2, 
            minHeight: { xs: '600px', lg: 0 },
            minWidth: { xs: '100%', lg: '400px' }
          }}>
            <BodePlot 
              poles={poles} 
              zeros={zeros}
              logarithmicFrequency={logarithmicFrequency}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
