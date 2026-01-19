import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ComplexPlane } from './components/ComplexPlane';
import { Toolbar } from './components/Toolbar';
import { BodePlot } from './components/BodePlot';
import { Settings } from './components/Settings';
import { FilterDesign, type FilterType, type BiquadType } from './components/FilterDesign';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from './types';
import { toPoleZeros } from './types';
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
  const [poles, setPoles] = useState<PoleOrZero[]>(() => {
    return [
      { id: getNextId(), real: 0.5, imag: 0.5, isPole: true } as PoleZeroPair,
    ];
  });

  const [zeros, setZeros] = useState<PoleOrZero[]>(() => [
    { id: getNextId(), real: -0.3, isPole: false } as PoleZeroReal,
  ]);

  // 設定状態
  const [enableSnap, setEnableSnap] = useState(true);
  const [logarithmicFrequency, setLogarithmicFrequency] = useState(true);

  // フィルタ設計状態
  const [filterType, setFilterType] = useState<FilterType>('none');
  const [biquadType, setBiquadType] = useState<BiquadType>('lowpass');
  const [cutoffFrequency, setCutoffFrequency] = useState<number>(Math.PI / 4);
  const [qFactor, setQFactor] = useState<number>(0.707); // Butterworth Q

  // フィルタ設計が変更されたら極・零点を更新
  useEffect(() => {
    if (filterType === 'biquad') {
      let result;
      switch (biquadType) {
        case 'lowpass':
          result = generateLowPassBiquad(cutoffFrequency, qFactor);
          break;
        case 'highpass':
          result = generateHighPassBiquad(cutoffFrequency, qFactor);
          break;
        case 'bandpass':
          result = generateBandPassBiquad(cutoffFrequency, qFactor);
          break;
        case 'bandstop':
          result = generateBandStopBiquad(cutoffFrequency, qFactor);
          break;
      }
      setPoles(result.poles);
      setZeros(result.zeros);
    }
  }, [filterType, biquadType, cutoffFrequency, qFactor]);

  // 極の移動処理
  const handlePoleMove = useCallback((id: string, real: number, imag: number) => {
    setPoles((prevPoles) =>
      prevPoles.map((pole) => {
        if (pole.id === id) {
          if ('imag' in pole) {
            return { ...pole, real, imag: Math.abs(imag) } as PoleZeroPair;
          } else {
            return { ...pole, real } as PoleZeroReal;
          }
        }
        return pole;
      })
    );
  }, []);

  // 零点の移動処理
  const handleZeroMove = useCallback((id: string, real: number, imag: number) => {
    setZeros((prevZeros) =>
      prevZeros.map((zero) => {
        if (zero.id === id) {
          if ('imag' in zero) {
            return { ...zero, real, imag: Math.abs(imag) } as PoleZeroPair;
          } else {
            return { ...zero, real } as PoleZeroReal;
          }
        }
        return zero;
      })
    );
  }, []);

  // 極ペアを追加
  const handleAddPolePair = useCallback(() => {
    setPoles((prev) => [
      ...prev,
      { id: getNextId(), real: 0.7, imag: 0.3, isPole: true } as PoleZeroPair,
    ]);
  }, []);

  // 実軸上の極を追加
  const handleAddPoleReal = useCallback(() => {
    setPoles((prev) => [
      ...prev,
      { id: getNextId(), real: 0.7, isPole: true } as PoleZeroReal,
    ]);
  }, []);

  // 零点ペアを追加
  const handleAddZeroPair = useCallback(() => {
    setZeros((prev) => [
      ...prev,
      { id: getNextId(), real: -0.7, imag: 0.3, isPole: false } as PoleZeroPair,
    ]);
  }, []);

  // 実軸上の零点を追加
  const handleAddZeroReal = useCallback(() => {
    setZeros((prev) => [
      ...prev,
      { id: getNextId(), real: -0.7, isPole: false } as PoleZeroReal,
    ]);
  }, []);

  // 極を削除
  const handleDeletePole = useCallback((id: string) => {
    setPoles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // 零点を削除
  const handleDeleteZero = useCallback((id: string) => {
    setZeros((prev) => prev.filter((z) => z.id !== id));
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
              poles={toPoleZeros(poles)} 
              zeros={toPoleZeros(zeros)}
              enableSnap={enableSnap}
              onPoleMove={handlePoleMove}
              onZeroMove={handleZeroMove}
            />
            <Toolbar
              poles={toPoleZeros(poles)}
              zeros={toPoleZeros(zeros)}
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
              qFactor={qFactor}
              onQFactorChange={setQFactor}
            />
          </Box>
          <Box sx={{ 
            flex: 2, 
            minHeight: { xs: '600px', lg: 0 },
            minWidth: { xs: '100%', lg: '400px' }
          }}>
            <BodePlot 
              poles={toPoleZeros(poles)} 
              zeros={toPoleZeros(zeros)}
              logarithmicFrequency={logarithmicFrequency}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
