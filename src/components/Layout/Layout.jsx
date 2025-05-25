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
import HistoryIcon from '@mui/icons-material/History';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemButton from '@mui/material/ListItemButton';
import Container from '@mui/material/Container';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === null ? true : savedMode === 'true';
  });
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
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
  ];

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="fixed">
          <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' } }}> {/* Shorter toolbar on mobile */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{
                mr: { xs: 1, sm: 2 }, // Less margin on mobile
                display: { sm: 'none' },
                p: { xs: 1, sm: 1.5 } // Smaller padding on mobile
              }}
              onClick={toggleDrawer(true)}
            >
              <MenuIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <ShowChartIcon sx={{
                mr: { xs: 0.5, sm: 1 }, // Less margin on mobile
                color: '#21CBF3',
                fontSize: { xs: '1.25rem', sm: '1.5rem' } // Smaller icon on mobile
              }} />
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
                  fontWeight: 700,
                  background: theme => theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)'
                    : 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                  fontSize: { xs: '0.9rem', sm: '1.5rem' }, // Much smaller on mobile
                  lineHeight: { xs: 1.2, sm: 1.5 },
                }}
              >
                Stock Market Simulator
              </Typography>
            </Box>
            <IconButton
              onClick={toggleDarkMode}
              color="inherit"
              sx={{ p: { xs: 1, sm: 1.5 } }} // Smaller padding on mobile
            >
              {darkMode ? (
                <Brightness7Icon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
              ) : (
                <Brightness4Icon sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
              )}
            </IconButton>
            <IconButton
              onClick={handleUserMenuClick}
              color="inherit"
              aria-controls="user-menu"
              aria-haspopup="true"
              sx={{ p: { xs: 0.5, sm: 1 } }} // Smaller padding on mobile
            >
              <Avatar sx={{
                width: { xs: 28, sm: 32 }, // Smaller avatar on mobile
                height: { xs: 28, sm: 32 },
                background: theme => theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
                  : 'linear-gradient(135deg, #263238 0%, #37474F 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.8rem', sm: '1rem' }, // Smaller font on mobile
                boxShadow: theme => theme.palette.mode === 'dark'
                  ? '0 2px 4px rgba(0,0,0,0.2)'
                  : 'none',
              }}>
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

        {/* Mobile Drawer - Much more compact */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          variant="temporary"
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              width: { xs: 200, sm: 240 }, // Narrower on mobile
              boxSizing: 'border-box'
            },
          }}
        >
          {/* Compact header */}
          <Box sx={{
            padding: '1rem', // Less padding on mobile
            borderBottom: theme => `1px solid ${theme.palette.divider}`
          }}>
            <Typography
              variant="h7"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1.25rem' }, // Smaller font on mobile
                fontWeight: 600
              }}
            >
              Stock Market Simulator
            </Typography>
          </Box>

          {/* Compact menu items */}
          <List sx={{ pt: 0 }}>
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
                    py: { xs: 1, sm: 1.5 }, // Less vertical padding on mobile
                    px: { xs: 1.5, sm: 2 }, // Less horizontal padding on mobile
                    minHeight: { xs: '40px', sm: '48px' }, // Shorter rows on mobile
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
                        : 'inherit',
                      minWidth: { xs: '32px', sm: '40px' }, // Smaller icon space on mobile
                      '& .MuiSvgIcon-root': {
                        fontSize: { xs: '1.1rem', sm: '1.25rem' } // Smaller icons on mobile
                      }
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: { xs: '0.85rem', sm: '1rem' }, // Smaller text on mobile
                        fontWeight: 500
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {/* Desktop Sidebar - Keep original size */}
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
              p: { xs: 1, sm: 3 }, // Already optimized
              mt: { xs: 7, sm: 8 }, // Smaller top margin on mobile due to shorter toolbar
              width: {
                xs: '100%',
                sm: `calc(100% - 240px)`
              },
              overflow: 'hidden',
            }}
          >
            <Container
              maxWidth="lg"
              sx={{
                px: { xs: 0.5, sm: 2 }, // Even less padding on mobile
                width: '100%',
                maxWidth: '100%',
              }}
            >
              <Outlet />
            </Container>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}