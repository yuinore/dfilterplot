import { Paper, Typography, Slider, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface GainControlProps {
  gain: number;
  onGainChange: (gain: number) => void;
}

export const GainControl = ({ gain, onGainChange }: GainControlProps) => {
  const { t } = useTranslation();

  // ゲインをdBに変換して表示
  const gainDB = 20 * Math.log10(gain);

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('gainControl.title')}
      </Typography>
      <Typography variant="body2" gutterBottom>
        {t('gainControl.gain')}: {gain.toFixed(3)} ({gainDB.toFixed(1)} dB)
      </Typography>
      <Slider
        value={gain}
        onChange={(_, value) => onGainChange(value as number)}
        min={0.001}
        max={100}
        step={0.001}
        scale={(x) => x}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${value.toFixed(3)} (${(20 * Math.log10(value)).toFixed(1)} dB)`}
      />
    </Paper>
  );
};

