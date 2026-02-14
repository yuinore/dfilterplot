import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Grid,
} from '@mui/material';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ComplexPlane } from './components/ComplexPlane';
import { Toolbar } from './components/Toolbar';
import { BodePlot } from './components/BodePlot';
import { Settings, type FrequencyUnit } from './components/Settings';
import { FilterDesignPanel } from './components/filters/FilterDesignPanel';
import { GainControl } from './components/GainControl';
import type { PoleOrZero, PoleZeroReal, PoleZeroPair } from './types';
import { toPoleZeros } from './types';
import { FilterRegistry } from './filters';
import { BODE_PLOT } from './constants';
import { calculateAutoGain } from './utils/transferFunction';

function App() {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
        },
        breakpoints: {
          values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1880,
          },
        },
      }),
    [],
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
      { id: getNextId(), real: 0.6, imag: 0.6, isPole: true } as PoleZeroPair,
    ];
  });

  const [zeros, setZeros] = useState<PoleOrZero[]>(() => [
    { id: getNextId(), real: -0.3, isPole: false } as PoleZeroReal,
  ]);

  // 設定状態
  const [enableSnap, setEnableSnap] = useState(true);
  const [logarithmicFrequency, setLogarithmicFrequency] = useState(true);
  const [octaves, setOctaves] = useState<number>(BODE_PLOT.DEFAULT_OCTAVES);
  const [gain, setGain] = useState<number>(1.0);
  const [autoGain, setAutoGain] = useState<boolean>(false);
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('44100');

  // 自動調整が有効な場合、ゲインを自動計算
  useEffect(() => {
    if (autoGain) {
      const calculatedGain = calculateAutoGain(
        poles,
        zeros,
        logarithmicFrequency,
        octaves,
      );
      setGain(calculatedGain);
    }
  }, [autoGain, poles, zeros, logarithmicFrequency, octaves]);

  // フィルタ設計の変更を処理
  const handleFilterChange = useCallback(
    (filterId: string, params: Record<string, any>) => {
      if (filterId === 'none') {
        return;
      }

      const filter = FilterRegistry.get(filterId);
      if (filter) {
        const result = filter.generate(params);
        setPoles(result.poles);
        setZeros(result.zeros);
        // 自動調整が無効な場合のみ、フィルタ設計のゲインを使用
        if (!autoGain) {
          setGain(result.gain);
        }
      }
    },
    [autoGain],
  );

  // 極の移動処理
  const handlePoleMove = useCallback(
    (id: string, real: number, imag: number) => {
      // 共役ペアの場合、IDに _conj サフィックスが付いているので削除
      const actualId = id.endsWith('_conj') ? id.replace('_conj', '') : id;

      setPoles((prevPoles) =>
        prevPoles.map((pole) => {
          if (pole.id === actualId) {
            if ('imag' in pole) {
              return { ...pole, real, imag: Math.abs(imag) } as PoleZeroPair;
            } else {
              return { ...pole, real } as PoleZeroReal;
            }
          }
          return pole;
        }),
      );
    },
    [],
  );

  // 零点の移動処理
  const handleZeroMove = useCallback(
    (id: string, real: number, imag: number) => {
      // 共役ペアの場合、IDに _conj サフィックスが付いているので削除
      const actualId = id.endsWith('_conj') ? id.replace('_conj', '') : id;

      setZeros((prevZeros) =>
        prevZeros.map((zero) => {
          if (zero.id === actualId) {
            if ('imag' in zero) {
              return { ...zero, real, imag: Math.abs(imag) } as PoleZeroPair;
            } else {
              return { ...zero, real } as PoleZeroReal;
            }
          }
          return zero;
        }),
      );
    },
    [],
  );

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
    // 共役ペアの場合、IDに _conj サフィックスが付いているので削除
    const actualId = id.endsWith('_conj') ? id.replace('_conj', '') : id;
    setPoles((prev) => prev.filter((p) => p.id !== actualId));
  }, []);

  // 零点を削除
  const handleDeleteZero = useCallback((id: string) => {
    // 共役ペアの場合、IDに _conj サフィックスが付いているので削除
    const actualId = id.endsWith('_conj') ? id.replace('_conj', '') : id;
    setZeros((prev) => prev.filter((z) => z.id !== actualId));
  }, []);

  // すべてクリア
  const handleClear = useCallback(() => {
    setPoles([]);
    setZeros([]);
    setGain(1.0);
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
            p: { xs: 3, lg: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row', lg: 'row' },
            gap: { xs: 3, lg: 3 },
            overflow: 'auto',
          }}
        >
          <Box
            id="controller-box"
            sx={{
              flexGrow: 4,
              flexShrink: 4,
              flexBasis: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              // minWidth: { sm: '100%', lg: '400px' },
              maxWidth: { xs: '480px', lg: '720px' },
            }}
          >
            <Box
              id="complex-plane-combi"
              sx={{
                flexGrow: 0,
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                alignItems: 'flex-start',
                gap: 2,
                width: '100%',
                maxWidth: { xs: '360px', lg: '720px' },
              }}
            >
              <ComplexPlane
                poles={toPoleZeros(poles)}
                zeros={toPoleZeros(zeros)}
                enableSnap={enableSnap}
                onPoleMove={handlePoleMove}
                onZeroMove={handleZeroMove}
              />
              <Grid container spacing={2} width="100%">
                <Grid size={12}>
                  <GainControl
                    gain={gain}
                    onGainChange={setGain}
                    autoGain={autoGain}
                    onAutoGainChange={setAutoGain}
                  />
                </Grid>
                <Grid size={12}>
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
                </Grid>
              </Grid>
            </Box>
            <FilterDesignPanel
              onFilterChange={handleFilterChange}
              logarithmicFrequency={logarithmicFrequency}
              frequencyUnit={frequencyUnit}
            />
            <Settings
              enableSnap={enableSnap}
              onEnableSnapChange={setEnableSnap}
              logarithmicFrequency={logarithmicFrequency}
              onLogarithmicFrequencyChange={setLogarithmicFrequency}
              octaves={octaves}
              onOctavesChange={setOctaves}
              frequencyUnit={frequencyUnit}
              onFrequencyUnitChange={setFrequencyUnit}
            />
          </Box>
          <Box
            id="bode-plot-box"
            sx={{
              flexGrow: 2,
              flexShrink: 2,
              flexBasis: 480,
              minWidth: 0, // Flexboxで縮小を許可
              // minHeight: { xs: '600px', lg: 0 },
              // minWidth: { xs: '400px', lg: '400px' }
            }}
          >
            <BodePlot
              poles={poles}
              zeros={zeros}
              logarithmicFrequency={logarithmicFrequency}
              octaves={octaves}
              gain={gain}
              frequencyUnit={frequencyUnit}
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
