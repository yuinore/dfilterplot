import { Slider, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { CollapsiblePanel } from './CollapsiblePanel';

interface GainControlProps {
  gain: number;
  onGainChange: (gain: number) => void;
}

export const GainControl = ({ gain, onGainChange }: GainControlProps) => {
  const { t } = useTranslation();

  // リニアスケールの範囲: -1 ～ 1
  const minGain = -1;
  const maxGain = 1;

  // ゲインを-1～1の範囲にクランプ
  const clampedGain = Math.max(minGain, Math.min(maxGain, gain));

  let gainLabel = clampedGain.toFixed(6);

  if (Math.abs(clampedGain) < 1e-4 && clampedGain !== 0.0) {
    // 小さすぎる場合は科学的表記にする
    gainLabel = clampedGain.toExponential(2);
  }

  return (
    <CollapsiblePanel
      title={`${t('gainControl.title')} (${gainLabel})`}
      defaultExpanded={false}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Slider
          value={clampedGain}
          onChange={(_, value) => onGainChange(value as number)}
          min={minGain}
          max={maxGain}
          step={0.001}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => value.toFixed(3)}
          sx={{ flex: 1 }}
        />
      </Box>
    </CollapsiblePanel>
  );
};
