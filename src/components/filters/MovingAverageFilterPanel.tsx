import { Box, Typography, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface MovingAverageFilterPanelProps {
  onChange: (params: { length: number }) => void;
  logarithmicFrequency?: boolean;
}

export const MovingAverageFilterPanel = ({ onChange }: MovingAverageFilterPanelProps) => {
  const { t } = useTranslation();
  const [length, setLength] = useState<number>(8);

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({ length });
  }, [length, onChange]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.movingAverage.length')}: {length} {t('filters.movingAverage.samples')}
      </Typography>
      <Slider
        value={length}
        onChange={(_, value) => setLength(value as number)}
        min={2}
        max={64}
        step={1}
        marks={[
          { value: 2, label: '2' },
          { value: 8, label: '8' },
          { value: 16, label: '16' },
          { value: 32, label: '32' },
          { value: 64, label: '64' },
        ]}
        valueLabelDisplay="auto"
      />
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.movingAverage.description')}
      </Typography>
    </Box>
  );
};

