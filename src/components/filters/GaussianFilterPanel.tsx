import {
  Box,
  Typography,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import type { FilterPanelProps } from '../../filters/base';

export const GaussianFilterPanel = ({ onChange }: FilterPanelProps) => {
  const { t } = useTranslation();

  // 標準偏差（sigma）
  const [sigma, setSigma] = useState<number>(2.0);
  // タップ数（奇数、3-31）
  const [taps, setTaps] = useState<number>(15);
  // 窓関数
  const [windowFunction, setWindowFunction] = useState<string>('none');

  // パラメータ変更時に親に通知
  useEffect(() => {
    onChange({
      sigma: sigma,
      taps: taps,
      windowFunction: windowFunction,
    });
  }, [sigma, taps, windowFunction, onChange]);

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

      <Typography variant="subtitle2" gutterBottom>
        {t('filters.gaussian.windowFunction')}
      </Typography>
      <ToggleButtonGroup
        value={windowFunction}
        exclusive
        onChange={(_, value) => {
          if (value !== null) {
            setWindowFunction(value);
          }
        }}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="none">
          {t('filters.gaussian.windowNone')}
        </ToggleButton>
        <ToggleButton value="hann">
          {t('filters.gaussian.windowHann')}
        </ToggleButton>
      </ToggleButtonGroup>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('filters.gaussian.description')}
      </Typography>
    </Box>
  );
};
