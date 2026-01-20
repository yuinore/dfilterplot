import { Paper, Typography, Slider, Box, FormControlLabel, Checkbox } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface GainControlProps {
  gain: number;
  onGainChange: (gain: number) => void;
  autoGain: boolean;
  onAutoGainChange: (autoGain: boolean) => void;
}

export const GainControl = ({ gain, onGainChange, autoGain, onAutoGainChange }: GainControlProps) => {
  const { t } = useTranslation();

  // リニアスケールの範囲: -1 ～ 1
  const minGain = -1;
  const maxGain = 1;

  // ゲインを-1～1の範囲にクランプ
  const clampedGain = Math.max(minGain, Math.min(maxGain, gain));

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('gainControl.title')}
      </Typography>
      <Typography variant="body2" gutterBottom>
        {t('gainControl.gain')}: {clampedGain.toFixed(6)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Slider
          value={clampedGain}
          onChange={(_, value) => onGainChange(value as number)}
          min={minGain}
          max={maxGain}
          step={0.001}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => value.toFixed(3)}
          disabled={autoGain}
          sx={{ flex: 1 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={autoGain}
              onChange={(e) => onAutoGainChange(e.target.checked)}
            />
          }
          label={t('gainControl.autoAdjust')}
        />
      </Box>
    </Paper>
  );
};

