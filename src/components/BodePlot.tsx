import { Box, Grid, Stack } from '@mui/material';
import { CollapsiblePanel } from './CollapsiblePanel';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { PoleOrZero } from '../types';
import type { FrequencyUnit } from './Settings';
import {
  calculateFrequencyResponse,
  calculateFrequencyResponseLog,
  calculateGroupDelay,
  calculateImpulseResponse,
  calculateStepResponse,
} from '../utils/transferFunction';
import { FREQUENCY_RESPONSE, BODE_PLOT, TIME_RESPONSE } from '../constants';
import { calculateTimeResponseAxisRange } from '../utils/chartUtils';

// Chart.js の登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface BodePlotProps {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
  logarithmicFrequency: boolean;
  octaves: number;
  gain: number;
  frequencyUnit: FrequencyUnit;
}

/**
 * 角周波数（rad/s）を指定された単位に変換
 * @param omega 角周波数（rad/s）
 * @param unit 単位
 * @returns 変換後の周波数
 */
function convertFrequency(omega: number, unit: FrequencyUnit): number {
  if (unit === 'radians') {
    return omega;
  }
  // ω = 2π * f / Fs => f = (ω * Fs) / (2π)
  const sampleRate = unit === '44100' ? 44100 : 48000;
  return (omega * sampleRate) / (2 * Math.PI);
}

/**
 * 周波数単位のラベルを取得
 * @param unit 単位
 * @returns ラベル文字列
 */
function getFrequencyLabel(unit: FrequencyUnit): string {
  if (unit === 'radians') {
    return 'rad/s';
  }
  return 'Hz';
}

export const BodePlot = ({
  poles,
  zeros,
  logarithmicFrequency,
  octaves,
  gain,
  frequencyUnit,
}: BodePlotProps) => {
  const { t } = useTranslation();

  // 周波数応答を計算
  const frequencyResponse = useMemo(() => {
    if (logarithmicFrequency) {
      return calculateFrequencyResponseLog(
        zeros,
        poles,
        FREQUENCY_RESPONSE.NUM_POINTS,
        octaves,
        gain,
      );
    } else {
      return calculateFrequencyResponse(
        zeros,
        poles,
        FREQUENCY_RESPONSE.NUM_POINTS,
        gain,
      );
    }
  }, [zeros, poles, logarithmicFrequency, octaves, gain]);

  // 群遅延を計算
  const groupDelayResponse = useMemo(() => {
    return calculateGroupDelay(
      zeros,
      poles,
      FREQUENCY_RESPONSE.NUM_POINTS,
      logarithmicFrequency,
      octaves,
      gain,
    );
  }, [zeros, poles, logarithmicFrequency, octaves, gain]);

  // インパルス応答を計算
  const impulseResponse = useMemo(() => {
    return calculateImpulseResponse(
      zeros,
      poles,
      TIME_RESPONSE.NUM_SAMPLES,
      gain,
    );
  }, [zeros, poles, gain]);

  // ステップ応答を計算
  const stepResponse = useMemo(() => {
    return calculateStepResponse(zeros, poles, TIME_RESPONSE.NUM_SAMPLES, gain);
  }, [zeros, poles, gain]);

  // 振幅特性のグラフデータ
  const magnitudeData = useMemo(() => {
    const convertedFrequency = frequencyResponse.frequency.map((f) =>
      convertFrequency(f, frequencyUnit),
    );
    return {
      labels: convertedFrequency,
      datasets: [
        {
          label: t('bodePlot.magnitude'),
          data: frequencyResponse.magnitude,
          borderColor: 'rgb(25, 118, 210)',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  }, [frequencyResponse, t, frequencyUnit]);

  // 位相特性のグラフデータ
  const phaseData = useMemo(() => {
    const convertedFrequency = frequencyResponse.frequency.map((f) =>
      convertFrequency(f, frequencyUnit),
    );
    return {
      labels: convertedFrequency,
      datasets: [
        {
          label: t('bodePlot.phase'),
          data: frequencyResponse.phase,
          borderColor: 'rgb(46, 125, 50)',
          backgroundColor: 'rgba(46, 125, 50, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  }, [frequencyResponse, t, frequencyUnit]);

  // 共通のグラフオプション
  const commonOptions = useMemo(() => {
    // 角周波数の範囲を計算
    const omegaMin = logarithmicFrequency ? Math.PI / Math.pow(2, octaves) : 0;
    const omegaMax = Math.PI;

    // 指定された単位に変換
    const xMin = convertFrequency(omegaMin, frequencyUnit);
    const xMax = convertFrequency(omegaMax, frequencyUnit);

    // 軸ラベルを生成
    const frequencyLabel = `${t('bodePlot.frequency')} (${getFrequencyLabel(frequencyUnit)})`;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          type: logarithmicFrequency
            ? ('logarithmic' as const)
            : ('linear' as const),
          title: {
            display: true,
            text: frequencyLabel,
          },
          min: xMin,
          max: xMax,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          mode: 'nearest' as const,
          intersect: false,
        },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    };
  }, [logarithmicFrequency, octaves, t, frequencyUnit]);

  // 振幅特性のオプション
  const magnitudeOptions = useMemo(
    () => ({
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          title: {
            display: true,
            text: t('bodePlot.magnitudeDB'),
          },
          min: BODE_PLOT.MAGNITUDE_MIN_DB,
          max: BODE_PLOT.MAGNITUDE_MAX_DB,
        },
      },
    }),
    [commonOptions, t],
  );

  // 位相特性のオプション
  const phaseOptions = useMemo(
    () => ({
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          title: {
            display: true,
            text: t('bodePlot.phaseDeg'),
          },
          min: -180,
          max: 180,
        },
      },
    }),
    [commonOptions, t],
  );

  // 群遅延のグラフデータ
  const groupDelayData = useMemo(() => {
    const convertedFrequency = groupDelayResponse.frequency.map((f) =>
      convertFrequency(f, frequencyUnit),
    );
    return {
      labels: convertedFrequency,
      datasets: [
        {
          label: t('bodePlot.groupDelay'),
          data: groupDelayResponse.groupDelay,
          borderColor: 'rgb(211, 47, 47)',
          backgroundColor: 'rgba(211, 47, 47, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        },
      ],
    };
  }, [groupDelayResponse, t, frequencyUnit]);

  // 群遅延のオプション
  const groupDelayOptions = useMemo(
    () => ({
      ...commonOptions,
      scales: {
        ...commonOptions.scales,
        y: {
          title: {
            display: true,
            text: t('bodePlot.delaySamples'),
          },
        },
      },
    }),
    [commonOptions, t],
  );

  // インパルス応答のグラフデータ
  const impulseData = useMemo(() => {
    return {
      labels: impulseResponse.time,
      datasets: [
        {
          label: t('bodePlot.impulseResponse'),
          data: impulseResponse.amplitude,
          borderColor: 'rgb(123, 31, 162)',
          backgroundColor: 'rgb(123, 31, 162)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.1,
        },
      ],
    };
  }, [impulseResponse, t]);

  // インパルス応答のオプション
  const impulseOptions = useMemo(() => {
    // y軸の範囲を動的に計算
    const { min: yMin, max: yMax } = calculateTimeResponseAxisRange(
      impulseResponse.amplitude,
      -0.1,
      0.1,
    );

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          type: 'linear' as const,
          title: {
            display: true,
            text: t('bodePlot.time'),
          },
        },
        y: {
          title: {
            display: true,
            text: t('bodePlot.amplitude'),
          },
          min: yMin,
          max: yMax,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          mode: 'nearest' as const,
          intersect: false,
        },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    };
  }, [impulseResponse, t]);

  // ステップ応答のグラフデータ
  const stepData = useMemo(() => {
    return {
      labels: stepResponse.time,
      datasets: [
        {
          label: t('bodePlot.stepResponse'),
          data: stepResponse.amplitude,
          borderColor: 'rgb(245, 124, 0)',
          backgroundColor: 'rgb(245, 124, 0)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.1,
        },
      ],
    };
  }, [stepResponse, t]);

  // ステップ応答のオプション
  const stepOptions = useMemo(() => {
    // y軸の範囲を動的に計算
    const { min: yMin, max: yMax } = calculateTimeResponseAxisRange(
      stepResponse.amplitude,
      -0.1,
      0.1,
    );

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          type: 'linear' as const,
          title: {
            display: true,
            text: t('bodePlot.time'),
          },
        },
        y: {
          title: {
            display: true,
            text: t('bodePlot.amplitude'),
          },
          min: yMin,
          max: yMax,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          mode: 'nearest' as const,
          intersect: false,
        },
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false,
      },
    };
  }, [stepResponse, t]);

  return (
    <Grid
      container
      direction="row"
      spacing={2}
      sx={{
        // display: 'flex',
        // flexDirection: 'column',
        // gap: 2,
        // height: '100%',
        minWidth: 0, // Flexboxで縮小を許可
      }}
    >
      <Grid size={{ xs: 12, xl: 6 }}>
        <CollapsiblePanel title={t('bodePlot.magnitude')}>
          <Box
            sx={{
              height: 'max(240px, calc((100% - 200px) / 5))',
              minWidth: 0,
              minHeight: 240,
            }}
          >
            <Line data={magnitudeData} options={magnitudeOptions} />
          </Box>
        </CollapsiblePanel>
      </Grid>

      <Grid size={{ xs: 12, xl: 6 }}>
        <CollapsiblePanel title={t('bodePlot.phase')}>
          <Box
            sx={{
              height: 'max(240px, calc((100% - 200px) / 5))',
              minWidth: 0,
              minHeight: 240,
            }}
          >
            <Line data={phaseData} options={phaseOptions} />
          </Box>
        </CollapsiblePanel>
      </Grid>

      <Grid size={{ xs: 12, xl: 6 }}>
        <CollapsiblePanel
          title={t('bodePlot.groupDelay')}
          // defaultExpanded={false}
        >
          <Box
            sx={{
              height: 'max(240px, calc((100% - 200px) / 5))',
              minWidth: 0,
              minHeight: 240,
            }}
          >
            <Line data={groupDelayData} options={groupDelayOptions} />
          </Box>
        </CollapsiblePanel>
      </Grid>

      <Grid size={{ xs: 12, xl: 6 }}>
        <CollapsiblePanel title={t('bodePlot.impulseResponse')}>
          <Box
            sx={{
              height: 'max(240px, calc((100% - 200px) / 5))',
              minWidth: 0,
              minHeight: 240,
            }}
          >
            <Line data={impulseData} options={impulseOptions} />
          </Box>
        </CollapsiblePanel>
      </Grid>

      <Grid size={{ xs: 12, xl: 6 }}>
        <CollapsiblePanel
          title={t('bodePlot.stepResponse')}
          // defaultExpanded={false}
        >
          <Box
            sx={{
              height: 'max(240px, calc((100% - 200px) / 5))',
              minWidth: 0,
              minHeight: 240,
            }}
          >
            <Line data={stepData} options={stepOptions} />
          </Box>
        </CollapsiblePanel>
      </Grid>
    </Grid>
  );
};
