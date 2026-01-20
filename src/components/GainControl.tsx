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

  // dBスケールの範囲: -120dB ～ 0dB
  const minDB = -120;
  const maxDB = 0;

  // 線形ゲインをdBに変換
  const linearToDb = (linear: number): number => {
    if (linear <= 0) return minDB;
    return 20 * Math.log10(linear);
  };

  // dBを線形ゲインに変換
  const dbToLinear = (db: number): number => {
    return Math.pow(10, db / 20);
  };

  // 現在のゲインをdBに変換
  const gainDB = linearToDb(gain);

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('gainControl.title')}
      </Typography>
      <Typography variant="body2" gutterBottom>
        {t('gainControl.gain')}: {gain.toFixed(6)} ({gainDB.toFixed(1)} dB)
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Slider
          value={gainDB}
          onChange={(_, value) => onGainChange(dbToLinear(value as number))}
          min={minDB}
          max={maxDB}
          step={0.1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value.toFixed(1)} dB`}
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

