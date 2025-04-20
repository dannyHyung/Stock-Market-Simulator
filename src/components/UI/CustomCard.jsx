import React from 'react';
import { Card, Box, useTheme } from '@mui/material';

const CustomCard = ({ children, sx = {}, padding = '4px', ...props }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    return (
        <Card
            sx={{
                height: '100%',
                boxShadow: isDarkMode
                    // For dark mode: subtle glow + border
                    ? '0 0 15px rgba(66, 153, 225, 0.15), 0 0 8px rgba(66, 153, 225, 0.08)'
                    // For light mode: regular shadow
                    : '0 6px 16px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.08)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                transition: 'all 0.2s',
                borderRadius: '10px',
                background: isDarkMode
                    // Slightly lighter than default dark background
                    ? 'linear-gradient(145deg, #2d2d2d 0%, #1f1f1f 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f7f9fc 100%)',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: isDarkMode
                        // Enhanced glow on hover for dark mode
                        ? '0 0 20px rgba(66, 153, 225, 0.25), 0 0 10px rgba(66, 153, 225, 0.15)'
                        : '0 10px 20px rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.08)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                },
                ...sx
            }}
            {...props}
        >
            <Box sx={{ p: padding }}>
                {children}
            </Box>
        </Card>
    );
};

export default CustomCard;