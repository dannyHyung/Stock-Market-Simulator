import React from 'react';
import { TableContainer, Table, Paper, useTheme } from '@mui/material';

const CustomTable = ({ children, sx = {}, tableProps = {}, ...props }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    return (
        <TableContainer
            component={Paper}
            sx={{
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: isDarkMode
                    // For dark mode: subtle glow + border
                    ? '0 0 15px rgba(66, 153, 225, 0.15), 0 0 8px rgba(66, 153, 225, 0.08)'
                    // For light mode: regular shadow
                    : '0 6px 16px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.08)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                transition: 'all 0.2s',
                '& .MuiTableRow-root:hover': {
                    backgroundColor: isDarkMode
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                },
                '&:hover': {
                    boxShadow: isDarkMode
                        // Enhanced glow on hover for dark mode
                        ? '0 0 20px rgba(66, 153, 225, 0.25), 0 0 10px rgba(66, 153, 225, 0.15)'
                        : '0 10px 20px rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.08)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                },
                ...sx // This allows merging additional sx props
            }}
            {...props}
        >
            <Table {...tableProps}>
                {children}
            </Table>
        </TableContainer>
    );
};

export default CustomTable;