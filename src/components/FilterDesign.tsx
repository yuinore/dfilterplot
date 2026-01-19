import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export type FilterType = 'none' | 'biquad';
export type BiquadType = 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';

interface FilterDesignProps {
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  biquadType: BiquadType;
  onBiquadTypeChange: (type: BiquadType) => void;
  cutoffFrequency: number;
  onCutoffFrequencyChange: (freq: number) => void;
}

export const FilterDesign = ({
  filterType,
  onFilterTypeChange,
  biquadType,
  onBiquadTypeChange,
  cutoffFrequency,
  onCutoffFrequencyChange,
}: FilterDesignProps) => {
  const { t } = useTranslation();

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('filterDesign.title')}
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>{t('filterDesign.filterType')}</InputLabel>
        <Select
          value={filterType}
          label={t('filterDesign.filterType')}
          onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
        >
          <MenuItem value="none">-</MenuItem>
          <MenuItem value="biquad">{t('filterDesign.biquad')}</MenuItem>
        </Select>
      </FormControl>

      {filterType === 'biquad' && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('filterDesign.filterType')}
          </Typography>
          <ToggleButtonGroup
            value={biquadType}
            exclusive
            onChange={(_, newType) => {
              if (newType !== null) {
                onBiquadTypeChange(newType);
              }
            }}
            aria-label="biquad filter type"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="lowpass" size="small">
              {t('filterDesign.lowPass')}
            </ToggleButton>
            <ToggleButton value="highpass" size="small">
              {t('filterDesign.highPass')}
            </ToggleButton>
            <ToggleButton value="bandpass" size="small">
              {t('filterDesign.bandPass')}
            </ToggleButton>
            <ToggleButton value="bandstop" size="small">
              {t('filterDesign.bandStop')}
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="subtitle2" gutterBottom>
            {t('filterDesign.cutoffFrequency')}: {cutoffFrequency.toFixed(3)} (rad/s)
          </Typography>
          <Slider
            value={cutoffFrequency}
            onChange={(_, value) => onCutoffFrequencyChange(value as number)}
            min={0.01}
            max={Math.PI}
            step={0.01}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => value.toFixed(3)}
          />
        </Box>
      )}
    </Paper>
  );
};

