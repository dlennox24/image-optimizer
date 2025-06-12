import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeToggle } from '../theme/CustomMuiThemeProvider';

const ThemeModeSelector = () => {
  const { mode, setMode, actualMode } = useThemeToggle();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    handleClose();
  };

  const icon =
    mode === 'system' ? (
      <SettingsBrightnessIcon />
    ) : actualMode === 'dark' ? (
      <Brightness4Icon />
    ) : (
      <Brightness7Icon />
    );

  return (
    <>
      <Tooltip title="Theme mode">
        <IconButton color="inherit" onClick={handleOpen}>
          {icon}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem selected={mode === 'system'} onClick={() => handleSelect('system')}>
          <ListItemIcon>
            <SettingsBrightnessIcon />
          </ListItemIcon>
          <ListItemText primary="System" />
        </MenuItem>
        <MenuItem selected={mode === 'light'} onClick={() => handleSelect('light')}>
          <ListItemIcon>
            <Brightness7Icon />
          </ListItemIcon>
          <ListItemText primary="Light" />
        </MenuItem>
        <MenuItem selected={mode === 'dark'} onClick={() => handleSelect('dark')}>
          <ListItemIcon>
            <Brightness4Icon />
          </ListItemIcon>
          <ListItemText primary="Dark" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default ThemeModeSelector;
