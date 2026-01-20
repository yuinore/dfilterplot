import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';
import type { PoleZero } from '../types';
import { CollapsiblePanel } from './CollapsiblePanel';

interface ToolbarProps {
  poles: PoleZero[];
  zeros: PoleZero[];
  onAddPolePair: () => void;
  onAddPoleReal: () => void;
  onAddZeroPair: () => void;
  onAddZeroReal: () => void;
  onDeletePole: (id: string) => void;
  onDeleteZero: (id: string) => void;
  onClear: () => void;
}

export const Toolbar = ({
  onAddPolePair,
  onAddPoleReal,
  onAddZeroPair,
  onAddZeroReal,
  onClear,
}: ToolbarProps) => {
  const { t } = useTranslation();

  return (
    <CollapsiblePanel title={t('toolbar.title')}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAddPolePair}
          size="small"
        >
          {t('toolbar.addPolePair')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAddPoleReal}
          size="small"
        >
          {t('toolbar.addPoleReal')}
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAddZeroPair}
          size="small"
        >
          {t('toolbar.addZeroPair')}
        </Button>
        <Button
          variant="outlined"
          color="success"
          startIcon={<AddCircleOutlineIcon />}
          onClick={onAddZeroReal}
          size="small"
        >
          {t('toolbar.addZeroReal')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ClearIcon />}
          onClick={onClear}
          size="small"
        >
          {t('toolbar.clear')}
        </Button>
      </Box>
    </CollapsiblePanel>
  );
};

