import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
  onDuplicateAll: () => void;
}

export const Toolbar = ({
  poles,
  zeros,
  onAddPolePair,
  onAddPoleReal,
  onAddZeroPair,
  onAddZeroReal,
  onClear,
  onDuplicateAll,
}: ToolbarProps) => {
  const { t } = useTranslation();

  return (
    <CollapsiblePanel title={t('toolbar.title')}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
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
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
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
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={onClear}
            size="small"
          >
            {t('toolbar.clear')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={onDuplicateAll}
            size="small"
          >
            {t('toolbar.duplicateAll')}
          </Button>
        </Box>
      </Box>

      <Typography
        variant="body1"
        // color="text.secondary"
        sx={{ mt: 2 }}
      >
        {t('toolbar.poleCount', { count: poles.length })}
        ,&nbsp;&nbsp;
        {t('toolbar.zeroCount', { count: zeros.length })}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('toolbar.doubleClickPoleOrZeroToRemove')}
      </Typography>
    </CollapsiblePanel>
  );
};
