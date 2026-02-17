import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface CombFilterPanelProps {
  onChange: (params: { type: string; delay: number; gain: number }) => void;
  logarithmicFrequency?: boolean;
}

export const CombFilterPanel = ({ onChange }: CombFilterPanelProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<string>('feedforward');
  const [delay, setDelay] = useState<number>(8);
  const [gain, setGain] = useState<number>(0.5);

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({ type, delay, gain });
  }, [type, delay, gain, onChange]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.comb.type')}
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
        <ToggleButton value="feedforward">
          {t('filters.comb.feedforward')}
        </ToggleButton>
        <ToggleButton value="feedback">
          {t('filters.comb.feedback')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.comb.delay')}: {delay} {t('filters.comb.samples')}
      </Typography>
      <Slider
        value={delay}
        onChange={(_, value) => setDelay(value as number)}
        min={1}
        max={32}
        step={1}
        marks
        valueLabelDisplay="auto"
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.comb.gain')}: {gain.toFixed(2)}
      </Typography>
      <Slider
        value={gain}
        onChange={(_, value) => setGain(value as number)}
        min={-0.99}
        max={0.99}
        step={0.01}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => value.toFixed(2)}
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.comb.description')}
      </Typography>
    </Box>
  );
};
