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
import type { PoleZero } from '../types';
import { calculateFrequencyResponseLog } from '../utils/transferFunction';

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
  poles: PoleZero[];
  zeros: PoleZero[];
}

export const BodePlot = ({ poles, zeros }: BodePlotProps) => {
  const { t } = useTranslation();

  // 周波数応答を計算
  const frequencyResponse = useMemo(() => {
    return calculateFrequencyResponseLog(zeros, poles, 512);
  }, [zeros, poles]);

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
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'logarithmic' as const,
        title: {
          display: true,
          text: t('bodePlot.frequency'),
        },
        min: 0.001,
        max: Math.PI,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  // 振幅特性のオプション
  const magnitudeOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        title: {
          display: true,
          text: t('bodePlot.magnitudeDB'),
        },
      },
    },
  };

  // 位相特性のオプション
  const phaseOptions = {
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
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Paper elevation={3} sx={{ p: 2, flex: 1, minHeight: 0 }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.magnitude')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={magnitudeData} options={magnitudeOptions} />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 2, flex: 1, minHeight: 0 }}>
        <Typography variant="h6" gutterBottom>
          {t('bodePlot.phase')}
        </Typography>
        <Box sx={{ height: 'calc(100% - 40px)' }}>
          <Line data={phaseData} options={phaseOptions} />
        </Box>
      </Paper>
    </Box>
  );
};

