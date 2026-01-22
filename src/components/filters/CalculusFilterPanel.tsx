import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface CalculusFilterPanelProps {
  onChange: (params: { type: string }) => void;
}

export const CalculusFilterPanel = ({ onChange }: CalculusFilterPanelProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<string>('differentiator');

  // パラメータが変更されたら通知
  useEffect(() => {
    onChange({ type });
  }, [type, onChange]);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {t('filters.calculus.type')}
      </Typography>
      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={(_, newType) => {
          if (newType !== null) {
            setType(newType);
          }
        }}
        fullWidth
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="differentiator">
          {t('filters.calculus.differentiator')}
        </ToggleButton>
        <ToggleButton value="integrator">
          {t('filters.calculus.integrator')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
