import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName } from '../../services/users';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../../theme';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemButton from '@mui/material/ListItemButton';
import Container from '@mui/material/Container';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Fetch user display name
    async function fetchDisplayName() {
      const name = await getUserDisplayName(currentUser.uid);
      setUserName(name || currentUser.email.split('@')[0]);
    }

    fetchDisplayName();
  }, [currentUser, navigate]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
    handleUserMenuClose();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!currentUser) return null;

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Market', icon: <ShowChartIcon />, path: '/market' },
    { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
  ];

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2, display: { sm: 'none' } }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Stock Market Simulator
            </Typography>
            <IconButton onClick={toggleDarkMode} color="inherit">
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <IconButton
              onClick={handleUserMenuClick}
              color="inherit"
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem disabled>
                <Typography variant="body2">{userName}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          variant="temporary"
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
          }}
        >
          <Box sx={{ padding: '1rem' }}>
            <Typography variant="h6">Stock Market Simulator</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                disablePadding
                component={Link}
                to={item.path}
                onClick={toggleDrawer(false)}
              >
                <ListItemButton
                  selected={location.pathname === item.path}
                  sx={{
                    color: theme => theme.palette.mode === 'dark'
                      ? 'white'
                      : 'rgba(0, 0, 0, 0.87)',
                    '&.Mui-selected': {
                      backgroundColor: theme => theme.palette.mode === 'dark'
                        ? 'rgba(144, 202, 249, 0.16)'
                        : 'rgba(25, 118, 210, 0.08)',
                      color: theme => theme.palette.mode === 'dark'
                        ? '#90caf9'
                        : '#1976d2',
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: theme => theme.palette.mode === 'dark'
                        ? 'white'
                        : 'inherit'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          <Box
            component="nav"
            sx={{
              width: { sm: 240 },
              flexShrink: { sm: 0 },
              display: { xs: 'none', sm: 'block' },
            }}
          >
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: 240,
                  marginTop: '64px',
                  height: 'calc(100% - 64px)',
                },
              }}
              open
            >
              <List>
                {menuItems.map((item) => (
                  <ListItem
                    key={item.text}
                    disablePadding
                    component={Link}
                    to={item.path}
                  >
                    <ListItemButton
                      selected={location.pathname === item.path}
                      sx={{
                        color: theme => theme.palette.mode === 'dark'
                          ? 'white'
                          : 'rgba(0, 0, 0, 0.87)',
                        '&.Mui-selected': {
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(144, 202, 249, 0.16)'
                            : 'rgba(25, 118, 210, 0.08)',
                          color: theme => theme.palette.mode === 'dark'
                            ? '#90caf9'
                            : '#1976d2',
                        }
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: theme => theme.palette.mode === 'dark'
                            ? 'white'
                            : 'inherit'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Drawer>
          </Box>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 8,
              width: { sm: `calc(100% - 240px)` },
            }}
          >
            <Container maxWidth="lg">
              <Outlet />
            </Container>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}