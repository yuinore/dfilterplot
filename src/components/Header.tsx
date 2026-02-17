import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Link,
} from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [howToUseDialogOpen, setHowToUseDialogOpen] = useState(false);
  const [referencesDialogOpen, setReferencesDialogOpen] = useState(false);

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    handleLanguageMenuClose();
  };

  const handleHowToUseOpen = () => {
    setHowToUseDialogOpen(true);
  };

  const handleHowToUseClose = () => {
    setHowToUseDialogOpen(false);
  };

  const handleReferencesOpen = () => {
    setReferencesDialogOpen(true);
  };

  const handleReferencesClose = () => {
    setReferencesDialogOpen(false);
  };

  const references = [
    {
      title: 'Audio EQ Cookbook',
      author: 'Robert Bristow-Johnson',
      url: 'https://webaudio.github.io/Audio-EQ-Cookbook/Audio-EQ-Cookbook.txt',
      descriptionKey: 'references.audioEqCookbook',
    },
    {
      title: 'Bode Plot - Interactive Pole/Zero Placement',
      author: 'Control Systems Academy',
      url: 'https://controlsystemsacademy.com/0019/0019.html',
      descriptionKey: 'references.controlSystemsAcademy',
    },
    {
      title: 'Digital Filter',
      author: 'Paul Falstad',
      url: 'https://www.falstad.com/dfilter/',
      descriptionKey: 'references.falstadFilter',
    },
    {
      title:
        'マルチバンド（オーディオクロスオーバー）処理を実現するフィルタ（Butterworth, Linkwitz-Riley）のPython実装（2バンド）',
      author: 'Wizard Notes',
      url: 'https://www.wizard-notes.com/entry/python/audio-crossover-filter-2-band',
      descriptionKey: 'references.wizardNotesCrossover',
    },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.title')}
        </Typography>
        <IconButton
          color="inherit"
          onClick={handleHowToUseOpen}
          aria-label={t('header.aboutThisTool')}
        >
          <HelpOutlineIcon />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={handleReferencesOpen}
          aria-label={t('header.references')}
        >
          <InfoIcon />
        </IconButton>
        <IconButton
          color="inherit"
          onClick={handleLanguageMenuOpen}
          aria-label={t('header.language')}
        >
          <LanguageIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleLanguageMenuClose}
        >
          <MenuItem onClick={() => changeLanguage('ja')}>日本語</MenuItem>
          <MenuItem onClick={() => changeLanguage('en')}>English</MenuItem>
        </Menu>
        <Dialog
          open={howToUseDialogOpen}
          onClose={handleHowToUseClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{t('aboutThisTool.title')}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {t('aboutThisTool.description')}
            </Typography>
          </DialogContent>
        </Dialog>
        <Dialog
          open={referencesDialogOpen}
          onClose={handleReferencesClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>{t('references.title')}</DialogTitle>
          <DialogContent>
            <List>
              {references.map((ref, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={
                      <Link
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ref.title}
                      </Link>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {ref.author}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2">
                          {t(ref.descriptionKey)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
};
