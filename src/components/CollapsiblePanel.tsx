import { Paper, Typography, Collapse, IconButton, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  elevation?: number;
}

export const CollapsiblePanel = ({ 
  title, 
  children, 
  defaultExpanded = true,
  elevation = 3 
}: CollapsiblePanelProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Paper elevation={elevation} sx={{ p: 2, width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6">
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          aria-label={expanded ? '折りたたむ' : '展開'}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, overflow: 'visible', minHeight: 0 }}>
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};

