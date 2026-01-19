import { Box, Button, Paper, Typography, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import type { PoleZero } from '../types';

interface ToolbarProps {
  poles: PoleZero[];
  zeros: PoleZero[];
  onAddPole: () => void;
  onAddZero: () => void;
  onDeletePole: (id: string) => void;
  onDeleteZero: (id: string) => void;
  onClear: () => void;
}

export const Toolbar = ({
  poles,
  zeros,
  onAddPole,
  onAddZero,
  onDeletePole,
  onDeleteZero,
  onClear,
}: ToolbarProps) => {
  const { t } = useTranslation();

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAddPole}
        >
          {t('toolbar.addPole')}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAddZero}
        >
          {t('toolbar.addZero')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ClearIcon />}
          onClick={onClear}
        >
          {t('toolbar.clear')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* 極のリスト */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom color="error.main">
            {t('polezero.poles')} ({poles.length})
          </Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {poles
              .filter((pole) => !pole.isConjugate)
              .map((pole) => (
                <ListItem
                  key={pole.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label={t('polezero.delete')}
                      onClick={() => onDeletePole(pole.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${pole.real.toFixed(3)} ${pole.imag >= 0 ? '+' : ''}${pole.imag.toFixed(3)}j`}
                    secondary={pole.pairId ? t('polezero.real') + ' (+ ' + t('polezero.imag') + ')' : t('polezero.real')}
                  />
                </ListItem>
              ))}
            {poles.length === 0 && (
              <ListItem>
                <ListItemText secondary="No poles" />
              </ListItem>
            )}
          </List>
        </Box>

        {/* 零点のリスト */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom color="success.main">
            {t('polezero.zeros')} ({zeros.length})
          </Typography>
          <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
            {zeros
              .filter((zero) => !zero.isConjugate)
              .map((zero) => (
                <ListItem
                  key={zero.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label={t('polezero.delete')}
                      onClick={() => onDeleteZero(zero.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${zero.real.toFixed(3)} ${zero.imag >= 0 ? '+' : ''}${zero.imag.toFixed(3)}j`}
                    secondary={zero.pairId ? t('polezero.real') + ' (+ ' + t('polezero.imag') + ')' : t('polezero.real')}
                  />
                </ListItem>
              ))}
            {zeros.length === 0 && (
              <ListItem>
                <ListItemText secondary="No zeros" />
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    </Paper>
  );
};

