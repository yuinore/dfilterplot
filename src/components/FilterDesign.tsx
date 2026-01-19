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

export type FilterType = 'none' | 'biquad' | 'calculus';
export type BiquadType = 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
export type CalculusType = 'differentiator' | 'integrator';

interface FilterDesignProps {
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  biquadType: BiquadType;
  onBiquadTypeChange: (type: BiquadType) => void;
  calculusType: CalculusType;
  onCalculusTypeChange: (type: CalculusType) => void;
  cutoffFrequency: number;
  onCutoffFrequencyChange: (freq: number) => void;
  qFactor: number;
  onQFactorChange: (q: number) => void;
  logarithmicFrequency: boolean;
}

export const FilterDesign = ({
  filterType,
  onFilterTypeChange,
  biquadType,
  onBiquadTypeChange,
  calculusType,
  onCalculusTypeChange,
  cutoffFrequency,
  onCutoffFrequencyChange,
  qFactor,
  onQFactorChange,
  logarithmicFrequency,
}: FilterDesignProps) => {
  const { t } = useTranslation();

  // 対数スケールのための変換関数
  // 最小値は10オクターブの範囲（π/1024 ≈ 0.00307）に合わせる
  const minFreq = 0.001 * Math.PI;
  const maxFreq = Math.PI;
  const logMin = Math.log10(minFreq);
  const logMax = Math.log10(maxFreq);

  // 対数スケールの場合の値変換
  const getSliderValue = (freq: number) => {
    if (logarithmicFrequency) {
      return Math.log10(freq);
    }
    return freq;
  };

  const getFreqFromSlider = (sliderValue: number) => {
    if (logarithmicFrequency) {
      return Math.pow(10, sliderValue);
    }
    return sliderValue;
  };

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
          <MenuItem value="calculus">{t('filterDesign.calculus')}</MenuItem>
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
            value={getSliderValue(cutoffFrequency)}
            onChange={(_, value) => onCutoffFrequencyChange(getFreqFromSlider(value as number))}
            min={logarithmicFrequency ? logMin : minFreq}
            max={logarithmicFrequency ? logMax : maxFreq}
            step={logarithmicFrequency ? 0.01 : 0.001}
            scale={logarithmicFrequency ? ((x) => Math.pow(10, x)) : undefined}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => value.toFixed(3)}
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            {t('filterDesign.qFactor')}: {qFactor.toFixed(2)}
          </Typography>
          <Slider
            value={qFactor}
            onChange={(_, value) => onQFactorChange(value as number)}
            min={0.1}
            max={10}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => value.toFixed(2)}
          />
        </Box>
      )}

      {filterType === 'calculus' && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {t('filterDesign.filterType')}
          </Typography>
          <ToggleButtonGroup
            value={calculusType}
            exclusive
            onChange={(_, newType) => {
              if (newType !== null) {
                onCalculusTypeChange(newType);
              }
            }}
            aria-label="calculus filter type"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="differentiator" size="small">
              {t('filterDesign.differentiator')}
            </ToggleButton>
            <ToggleButton value="integrator" size="small">
              {t('filterDesign.integrator')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}
    </Paper>
  );
};

