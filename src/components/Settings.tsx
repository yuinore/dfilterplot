import {
  Typography,
  FormControlLabel,
  Switch,
  Box,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { BODE_PLOT } from '../constants';
import { CollapsiblePanel } from './CollapsiblePanel';

export type FrequencyUnit = 'radians' | '44100' | '48000';

interface SettingsProps {
  enableSnap: boolean;
  onEnableSnapChange: (enabled: boolean) => void;
  logarithmicFrequency: boolean;
  onLogarithmicFrequencyChange: (enabled: boolean) => void;
  octaves: number;
  onOctavesChange: (octaves: number) => void;
  frequencyUnit: FrequencyUnit;
  onFrequencyUnitChange: (unit: FrequencyUnit) => void;
}

export const Settings = ({
  enableSnap,
  onEnableSnapChange,
  logarithmicFrequency,
  onLogarithmicFrequencyChange,
  octaves,
  onOctavesChange,
  frequencyUnit,
  onFrequencyUnitChange,
}: SettingsProps) => {
  const { t } = useTranslation();

  return (
    <CollapsiblePanel title={t('settings.title')} defaultExpanded={false}>
      <FormControlLabel
        control={
          <Switch
            checked={enableSnap}
            onChange={(e) => onEnableSnapChange(e.target.checked)}
            color="primary"
          />
        }
        label={t('settings.enableSnap')}
        sx={{ display: 'block', mb: 1 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={logarithmicFrequency}
            onChange={(e) => onLogarithmicFrequencyChange(e.target.checked)}
            color="primary"
          />
        }
        label={t('settings.logarithmicFrequency')}
        sx={{ display: 'block', mb: 2 }}
      />
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          {t('settings.frequencyUnit')}
        </Typography>
        <ToggleButtonGroup
          value={frequencyUnit}
          exclusive
          onChange={(_, value) => {
            if (value !== null) {
              onFrequencyUnitChange(value);
            }
          }}
          fullWidth
          size="small"
          sx={{ mb: 1 }}
        >
          <ToggleButton value="radians">{t('settings.radians')}</ToggleButton>
          <ToggleButton value="44100">44.1kHz</ToggleButton>
          <ToggleButton value="48000">48kHz</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>
          {t('settings.octaves')}: {octaves}
        </Typography>
        <Slider
          value={octaves}
          onChange={(_, value) => onOctavesChange(value as number)}
          min={Math.min(...BODE_PLOT.OCTAVE_OPTIONS)}
          max={Math.max(...BODE_PLOT.OCTAVE_OPTIONS)}
          step={null}
          marks={BODE_PLOT.OCTAVE_OPTIONS.map((v) => ({
            value: v,
            label: v.toString(),
          }))}
          valueLabelDisplay="auto"
          disabled={!logarithmicFrequency}
        />
      </Box>
    </CollapsiblePanel>
  );
};
