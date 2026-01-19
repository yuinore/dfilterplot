import { Box, Typography, ToggleButtonGroup, ToggleButton, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface BiquadFilterPanelProps {
  onChange: (params: { type: string; cutoffFrequency: number; qFactor: number }) => void;
  logarithmicFrequency?: boolean;
}

export const BiquadFilterPanel = ({ onChange, logarithmicFrequency = false }: BiquadFilterPanelProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<string>('lowpass');
  const [cutoffFrequency, setCutoffFrequency] = useState<number>(Math.PI / 4);
  const [qFactor, setQFactor] = useState<number>(0.707);

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({ type, cutoffFrequency, qFactor });
  }, [type, cutoffFrequency, qFactor, onChange]);

  // 対数スケールの変換関数
  const minFreq = 0.001 * Math.PI;
  const maxFreq = Math.PI;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);

  const getSliderValue = (freq: number): number => {
    if (logarithmicFrequency) {
      return Math.log10(freq);
    }
    return freq;
  };

  const getFreqFromSlider = (sliderValue: number): number => {
    if (logarithmicFrequency) {
      return Math.pow(10, sliderValue);
    }
    return sliderValue;
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.biquad.type')}
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
          {t('filters.biquad.lowPass')}
        </ToggleButton>
        <ToggleButton value="highpass">
          {t('filters.biquad.highPass')}
        </ToggleButton>
        <ToggleButton value="bandpass">
          {t('filters.biquad.bandPass')}
        </ToggleButton>
        <ToggleButton value="bandstop">
          {t('filters.biquad.bandStop')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.biquad.cutoffFrequency')}: {cutoffFrequency.toFixed(3)} (rad/s)
      </Typography>
      <Slider
        value={getSliderValue(cutoffFrequency)}
        onChange={(_, value) => setCutoffFrequency(getFreqFromSlider(value as number))}
        min={logarithmicFrequency ? logMin : minFreq}
        max={logarithmicFrequency ? logMax : maxFreq}
        step={logarithmicFrequency ? 0.01 : 0.001}
        scale={logarithmicFrequency ? ((x) => Math.pow(10, x)) : undefined}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => value.toFixed(3)}
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.biquad.qFactor')}: {qFactor.toFixed(2)}
      </Typography>
      <Slider
        value={qFactor}
        onChange={(_, value) => setQFactor(value as number)}
        min={0.1}
        max={10}
        step={0.1}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => value.toFixed(2)}
      />
    </Box>
  );
};

