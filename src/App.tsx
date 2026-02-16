import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Grid,
  Alert,
  Snackbar,
  Typography,
  Link,
} from '@mui/material';
import { useMemo, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

const MAX_POLE_ZERO_COUNT = 256;

/** 展開後の極・零点の総数（共役ペアは 2 とカウント） */
function getExpandedCount(poles: PoleOrZero[], zeros: PoleOrZero[]): number {
  return toPoleZeros(poles).length + toPoleZeros(zeros).length;
}

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

  // ID カウンター（初期状態では ref を読まないため、初期 ID は固定値）
  const nextIdRef = useRef(3);

  const getNextId = useCallback(() => {
    const id = nextIdRef.current.toString();
    nextIdRef.current += 1;
    return id;
  }, []);

  // 初期の極と零点（デモ用）。レンダー中に ref を読まないよう ID は固定
  const [poles, setPoles] = useState<PoleOrZero[]>([
    { id: '1', real: 0.6, imag: 0.6, isPole: true } as PoleZeroPair,
  ]);

  const [zeros, setZeros] = useState<PoleOrZero[]>([
    { id: '2', real: -0.3, isPole: false } as PoleZeroReal,
  ]);

  // 設定状態
  const [enableSnap, setEnableSnap] = useState(true);
  const [logarithmicFrequency, setLogarithmicFrequency] = useState(true);
  const [showZeroPoleTooltip, setShowZeroPoleTooltip] = useState(true);
  const [octaves, setOctaves] = useState<number>(BODE_PLOT.DEFAULT_OCTAVES);
  const [gain, setGain] = useState<number>(1.0);
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('44100');
  const [limitErrorOpen, setLimitErrorOpen] = useState(false);
  const { t } = useTranslation();

  // フィルタ設計の変更を処理
  const handleFilterChange = useCallback(
    (filterId: string, params: Record<string, unknown>) => {
      if (filterId === 'none') {
        return;
      }

      const filter = FilterRegistry.get(filterId);
      if (filter) {
        const result = filter.generate(params);
        const count = getExpandedCount(result.poles, result.zeros);
        if (count > MAX_POLE_ZERO_COUNT) {
          setLimitErrorOpen(true);
          return;
        }
        setPoles(result.poles);
        setZeros(result.zeros);
        setGain(result.gain);
      }
    },
    [],
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
    const count = getExpandedCount(poles, zeros);
    if (count + 2 > MAX_POLE_ZERO_COUNT) {
      setLimitErrorOpen(true);
      return;
    }
    setPoles((prev) => [
      ...prev,
      { id: getNextId(), real: 0.7, imag: 0.3, isPole: true } as PoleZeroPair,
    ]);
  }, [poles, zeros, getNextId]);

  // 実軸上の極を追加
  const handleAddPoleReal = useCallback(() => {
    const count = getExpandedCount(poles, zeros);
    if (count + 1 > MAX_POLE_ZERO_COUNT) {
      setLimitErrorOpen(true);
      return;
    }
    setPoles((prev) => [
      ...prev,
      { id: getNextId(), real: 0.7, isPole: true } as PoleZeroReal,
    ]);
  }, [poles, zeros, getNextId]);

  // 零点ペアを追加
  const handleAddZeroPair = useCallback(() => {
    const count = getExpandedCount(poles, zeros);
    if (count + 2 > MAX_POLE_ZERO_COUNT) {
      setLimitErrorOpen(true);
      return;
    }
    setZeros((prev) => [
      ...prev,
      { id: getNextId(), real: -0.7, imag: 0.3, isPole: false } as PoleZeroPair,
    ]);
  }, [poles, zeros, getNextId]);

  // 実軸上の零点を追加
  const handleAddZeroReal = useCallback(() => {
    const count = getExpandedCount(poles, zeros);
    if (count + 1 > MAX_POLE_ZERO_COUNT) {
      setLimitErrorOpen(true);
      return;
    }
    setZeros((prev) => [
      ...prev,
      { id: getNextId(), real: -0.7, isPole: false } as PoleZeroReal,
    ]);
  }, [poles, zeros, getNextId]);

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

  // 全ての極と零点を複製（既存に追加し、ゲインは 2 乗）
  const handleDuplicateAll = useCallback(() => {
    const count = getExpandedCount(poles, zeros);
    if (count * 2 > MAX_POLE_ZERO_COUNT) {
      setLimitErrorOpen(true);
      return;
    }
    setPoles((prev) => [
      ...prev,
      ...prev.map((p) => ({ ...p, id: getNextId() }) as PoleOrZero),
    ]);
    setZeros((prev) => [
      ...prev,
      ...prev.map((z) => ({ ...z, id: getNextId() }) as PoleOrZero),
    ]);
    setGain((g) => g * g);
  }, [poles, zeros, getNextId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minHeight: 0,
            p: { xs: 3, lg: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 3, lg: 3 },
            overflow: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row', lg: 'row' },
              gap: { xs: 3, lg: 3 },
              flexShrink: 0,
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
                  showZeroPoleTooltip={showZeroPoleTooltip}
                  onPoleMove={handlePoleMove}
                  onZeroMove={handleZeroMove}
                  onDeletePole={handleDeletePole}
                  onDeleteZero={handleDeleteZero}
                />
                <Grid container spacing={2} width="100%">
                  <Grid id="gain-control-panel" size={12}>
                    <GainControl gain={gain} onGainChange={setGain} />
                  </Grid>
                  <Grid id="toolbar-panel" size={12}>
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
                      onDuplicateAll={handleDuplicateAll}
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
                showZeroPoleTooltip={showZeroPoleTooltip}
                onShowZeroPoleTooltipChange={setShowZeroPoleTooltip}
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
          <Box
            component="footer"
            sx={{
              flexShrink: 0,
              pt: 2,
              px: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Directed & Built by yuinore / See GitHub →{' '}
              <Link
                href="https://github.com/yuinore"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                https://github.com/yuinore
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={limitErrorOpen}
        autoHideDuration={6000}
        onClose={() => setLimitErrorOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setLimitErrorOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {t('toolbar.poleZeroLimitExceeded')}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
