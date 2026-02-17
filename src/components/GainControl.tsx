import { Slider, Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CollapsiblePanel } from './CollapsiblePanel';

interface GainControlProps {
  gain: number;
  onGainChange: (gain: number) => void;
}

const MIN_GAIN = -1;
const MAX_GAIN = 1;

function clamp(v: number): number {
  return Math.max(MIN_GAIN, Math.min(MAX_GAIN, v));
}

function formatGain(value: number): string {
  const clamped = clamp(value);
  if (Math.abs(clamped) < 1e-4 && clamped !== 0)
    return clamped.toExponential(2);
  return clamped.toFixed(4);
}

export const GainControl = ({ gain, onGainChange }: GainControlProps) => {
  const { t } = useTranslation();

  const clampedGain = clamp(gain);
  const gainLabel = formatGain(clampedGain);

  const handlePhaseInvert = () => {
    onGainChange(clamp(-clampedGain));
  };

  const handleReset = () => {
    onGainChange(1.0);
  };

  return (
    <CollapsiblePanel
      title={`${t('gainControl.title')} (${gainLabel})`}
      defaultExpanded={false}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Slider
            value={clampedGain}
            onChange={(_, value) => onGainChange(value as number)}
            min={MIN_GAIN}
            max={MAX_GAIN}
            step={0.001}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => v.toFixed(3)}
            sx={{ flex: 1 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handlePhaseInvert}>
            {t('gainControl.phaseInvert')}
          </Button>
          <Button variant="outlined" size="small" onClick={handleReset}>
            {t('gainControl.reset')}
          </Button>
        </Box>
      </Box>
    </CollapsiblePanel>
  );
};
