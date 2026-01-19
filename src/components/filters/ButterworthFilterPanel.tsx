import { Box, Typography, ToggleButtonGroup, ToggleButton, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface ButterworthFilterPanelProps {
  onChange: (params: { type: string; order: number; cutoffFrequency: number }) => void;
  logarithmicFrequency?: boolean;
}

export const ButterworthFilterPanel = ({ onChange, logarithmicFrequency = false }: ButterworthFilterPanelProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<string>('lowpass');
  const [order, setOrder] = useState<number>(4);
  const [cutoffFrequency, setCutoffFrequency] = useState<number>(Math.PI / 4);

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({ type, order, cutoffFrequency });
  }, [type, order, cutoffFrequency, onChange]);

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
        {t('filters.butterworth.cutoffFrequency')}: {cutoffFrequency.toFixed(3)} (rad/s)
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
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.butterworth.description')}
      </Typography>
    </Box>
  );
};

