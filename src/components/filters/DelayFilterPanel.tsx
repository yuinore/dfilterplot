import { Box, Typography, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface DelayFilterPanelProps {
  onChange: (params: { order: number }) => void;
}

export const DelayFilterPanel = ({ onChange }: DelayFilterPanelProps) => {
  const { t } = useTranslation();
  const [order, setOrder] = useState<number>(1);

  useEffect(() => {
    onChange({ order });
  }, [order, onChange]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.delay.order')}: {order}
      </Typography>
      <Slider
        value={order}
        onChange={(_, value) => setOrder(value as number)}
        min={1}
        max={16}
        step={1}
        marks={[
          { value: 1, label: '1' },
          { value: 4, label: '4' },
          { value: 8, label: '8' },
          { value: 12, label: '12' },
          { value: 16, label: '16' },
        ]}
        valueLabelDisplay="auto"
      />

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.delay.description')}
      </Typography>
    </Box>
  );
};
