import { Paper, Typography, Box } from '@mui/material';
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
import {
  calculateFrequencyResponse,
  calculateFrequencyResponseLog,
  calculateGroupDelay,
  calculateImpulseResponse,
  calculateStepResponse,
} from '../utils/transferFunction';
import { FREQUENCY_RESPONSE, BODE_PLOT, TIME_RESPONSE } from '../constants';

// Chart.js の登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BodePlotProps {
  poles: PoleOrZero[];
  zeros: PoleOrZero[];
  logarithmicFrequency: boolean;
  octaves: number;
  gain: number;
}

export const BodePlot = ({ poles, zeros, logarithmicFrequency, octaves, gain }: BodePlotProps) => {
  const { t } = useTranslation();

  // 周波数応答を計算
  const frequencyResponse = useMemo(() => {
    if (logarithmicFrequency) {
      return calculateFrequencyResponseLog(zeros, poles, FREQUENCY_RESPONSE.NUM_POINTS, octaves, gain);
    } else {
      return calculateFrequencyResponse(zeros, poles, FREQUENCY_RESPONSE.NUM_POINTS, gain);
    }
  }, [zeros, poles, logarithmicFrequency, octaves, gain]);

  // 群遅延を計算
  const groupDelayResponse = useMemo(() => {
    return calculateGroupDelay(zeros, poles, FREQUENCY_RESPONSE.NUM_POINTS, logarithmicFrequency, octaves, gain);
  }, [zeros, poles, logarithmicFrequency, octaves, gain]);

  // インパルス応答を計算
  const impulseResponse = useMemo(() => {
    return calculateImpulseResponse(zeros, poles, TIME_RESPONSE.NUM_SAMPLES, gain);
  }, [zeros, poles, gain]);

  // ステップ応答を計算
  const stepResponse = useMemo(() => {
    return calculateStepResponse(zeros, poles, TIME_RESPONSE.NUM_SAMPLES, gain);
  }, [zeros, poles, gain]);

  // 振幅特性のグラフデータ
  const magnitudeData = useMemo(() => {
    return {
      labels: frequencyResponse.frequency,
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
  }, [frequencyResponse, t]);

  // 位相特性のグラフデータ
  const phaseData = useMemo(() => {
    return {
      labels: frequencyResponse.frequency,
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
  }, [frequencyResponse, t]);

  // 共通のグラフオプション
  const commonOptions = useMemo(() => {
    // オクターブ数に応じたx軸の最小値を計算
    const xMin = logarithmicFrequency ? Math.PI / Math.pow(2, octaves) : 0;
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          type: logarithmicFrequency ? ('logarithmic' as const) : ('linear' as const),
          title: {
            display: true,
            text: t('bodePlot.frequency'),
          },
          min: xMin,
          max: Math.PI,
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
  }, [logarithmicFrequency, octaves, t]);

  // 振幅特性のオプション
  const magnitudeOptions = useMemo(() => ({
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
  }), [commonOptions, t]);

  // 位相特性のオプション
  const phaseOptions = useMemo(() => ({
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
  }), [commonOptions, t]);

  // 群遅延のグラフデータ
  const groupDelayData = useMemo(() => {
    return {
      labels: groupDelayResponse.frequency,
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
  }, [groupDelayResponse, t]);

  // 群遅延のオプション
  const groupDelayOptions = useMemo(() => ({
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
  }), [commonOptions, t]);

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
  const impulseOptions = useMemo(() => ({
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
        min: -0.5,
        max: 1.5,
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
  }), [t]);

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
  const stepOptions = useMemo(() => ({
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
        min: -0.5,
        max: 1.5,
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
  }), [t]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2, 
      height: '100%' 
    }}>
      <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.magnitude')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={magnitudeData} options={magnitudeOptions} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.phase')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={phaseData} options={phaseOptions} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.groupDelay')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={groupDelayData} options={groupDelayOptions} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.impulseResponse')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={impulseData} options={impulseOptions} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.stepResponse')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={stepData} options={stepOptions} />
        </Box>
      </Paper>
    </Box>
  );
};

