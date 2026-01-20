import { Typography, Slider, Box, FormControlLabel, Checkbox } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CollapsiblePanel } from './CollapsiblePanel';

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
    <CollapsiblePanel title={`${t('gainControl.title')} (${clampedGain.toFixed(6)})`} defaultExpanded={false}>
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
    </CollapsiblePanel>
  );
};

