import { Paper, Typography, FormControlLabel, Switch } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface SettingsProps {
  enableSnap: boolean;
  onEnableSnapChange: (enabled: boolean) => void;
}

export const Settings = ({ enableSnap, onEnableSnapChange }: SettingsProps) => {
  const { t } = useTranslation();

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('settings.title')}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={enableSnap}
            onChange={(e) => onEnableSnapChange(e.target.checked)}
            color="primary"
          />
        }
        label={t('settings.enableSnap')}
      />
    </Paper>
  );
};

