import { Box, Typography, Slider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import type { FilterPanelProps } from '../../filters/base';

export const GaussianFilterPanel = ({ onChange }: FilterPanelProps) => {
  const { t } = useTranslation();
  
  // 標準偏差（sigma）
  const [sigma, setSigma] = useState<number>(1.0);
  // タップ数（奇数、3-31）
  const [taps, setTaps] = useState<number>(9);

  // パラメータ変更時に親に通知
  useEffect(() => {
    onChange({
      sigma: sigma,
      taps: taps,
    });
  }, [sigma, taps, onChange]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.gaussian.sigma')}: {sigma.toFixed(3)}
      </Typography>
      <Slider
        value={sigma}
        onChange={(_, value) => setSigma(value as number)}
        min={0.1}
        max={5.0}
        step={0.01}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => value.toFixed(2)}
        sx={{ mb: 2 }}
      />
      
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.gaussian.taps')}
      </Typography>
      <Slider
        value={taps}
        onChange={(_, value) => setTaps(value as number)}
        min={3}
        max={31}
        step={2} // 奇数のみ
        marks={false}
        valueLabelDisplay="auto"
        sx={{ mb: 2 }}
      />
    </Box>
  );
};

