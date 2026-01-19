import { Box, Typography, ToggleButtonGroup, ToggleButton, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import type { FrequencyUnit } from '../Settings';

interface ButterworthFilterPanelProps {
  onChange: (params: { type: string; order: number; cutoffFrequency: number }) => void;
  logarithmicFrequency?: boolean;
  frequencyUnit?: FrequencyUnit;
}

/**
 * 角周波数（rad/s）を指定された単位に変換
 */
function convertFrequencyToDisplay(omega: number, unit: FrequencyUnit = 'radians'): number {
  if (unit === 'radians') {
    return omega;
  }
  const sampleRate = unit === '44100' ? 44100 : 48000;
  return (omega * sampleRate) / (2 * Math.PI);
}

/**
 * 表示単位から角周波数（rad/s）に変換
 */
function convertFrequencyFromDisplay(freq: number, unit: FrequencyUnit = 'radians'): number {
  if (unit === 'radians') {
    return freq;
  }
  const sampleRate = unit === '44100' ? 44100 : 48000;
  return (freq * 2 * Math.PI) / sampleRate;
}

/**
 * 周波数単位のラベルを取得
 */
function getFrequencyLabel(unit: FrequencyUnit = 'radians'): string {
  if (unit === 'radians') {
    return 'rad/s';
  }
  return 'Hz';
}

export const ButterworthFilterPanel = ({ onChange, logarithmicFrequency = false, frequencyUnit = 'radians' }: ButterworthFilterPanelProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<string>('lowpass');
  const [order, setOrder] = useState<number>(4);
  const [cutoffFrequency, setCutoffFrequency] = useState<number>(Math.PI / 4);

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({ type, order, cutoffFrequency });
  }, [type, order, cutoffFrequency, onChange]);

  // スライダーの範囲（rad/s）
  const minFreqRad = 0.001 * Math.PI;
  const maxFreqRad = Math.PI;
  
  // 表示単位に変換
  const minFreqDisplay = convertFrequencyToDisplay(minFreqRad, frequencyUnit);
  const maxFreqDisplay = convertFrequencyToDisplay(maxFreqRad, frequencyUnit);
  
  // 対数スケール用
  const logMin = Math.log10(minFreqDisplay);
  const logMax = Math.log10(maxFreqDisplay);

  const getSliderValue = (freqRad: number): number => {
    const freqDisplay = convertFrequencyToDisplay(freqRad, frequencyUnit);
    if (logarithmicFrequency) {
      return Math.log10(freqDisplay);
    }
    return freqDisplay;
  };

  const getFreqFromSlider = (sliderValue: number): number => {
    let freqDisplay: number;
    if (logarithmicFrequency) {
      freqDisplay = Math.pow(10, sliderValue);
    } else {
      freqDisplay = sliderValue;
    }
    return convertFrequencyFromDisplay(freqDisplay, frequencyUnit);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.butterworth.type')}
      </Typography>
      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={(_, newType) => {
          if (newType !== null) {
            setType(newType);
          }
        }}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="lowpass">
          {t('filters.butterworth.lowPass')}
        </ToggleButton>
        <ToggleButton value="highpass">
          {t('filters.butterworth.highPass')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.butterworth.order')}: {order}
      </Typography>
      <Slider
        value={order}
        onChange={(_, value) => setOrder(value as number)}
        min={1}
        max={10}
        step={1}
        marks
        valueLabelDisplay="auto"
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.butterworth.cutoffFrequency')}: {convertFrequencyToDisplay(cutoffFrequency, frequencyUnit).toFixed(frequencyUnit === 'radians' ? 3 : 1)} ({getFrequencyLabel(frequencyUnit)})
      </Typography>
      <Slider
        value={getSliderValue(cutoffFrequency)}
        onChange={(_, value) => setCutoffFrequency(getFreqFromSlider(value as number))}
        min={logarithmicFrequency ? logMin : minFreqDisplay}
        max={logarithmicFrequency ? logMax : maxFreqDisplay}
        step={logarithmicFrequency ? 0.01 : (frequencyUnit === 'radians' ? 0.001 : 10)}
        scale={logarithmicFrequency ? ((x) => Math.pow(10, x)) : undefined}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => value.toFixed(frequencyUnit === 'radians' ? 3 : 0)}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.butterworth.description')}
      </Typography>
    </Box>
  );
};

