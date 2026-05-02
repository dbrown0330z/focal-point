import { createTheme } from '@mui/material/styles';

function createAdminTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  return createTheme({

    palette: {
      mode,
      primary: {
        main: isDark ? '#4A7FC4' : '#1E4D8C',
        dark: isDark ? '#5A8FD4' : '#163A6B',
      },
      secondary: {
        main: isDark ? '#6A8FA8' : '#4A6880',
        dark: isDark ? '#7AA0B8' : '#3A5468',
      },
      error: {
        main:         '#D32F2F',
        light:        isDark ? '#3D1212' : '#FDEEEE',
        contrastText: isDark ? '#F09595' : '#7A1515',
      },
      warning: {
        main:         isDark ? '#D4A800' : '#A67C00',
        light:        isDark ? '#3A2E00' : '#FFFBE6',
        contrastText: isDark ? '#FAD84A' : '#6B5000',
      },
      success: {
        main:         '#2E7D32',
        light:        isDark ? '#122412' : '#EDFAF0',
        contrastText: isDark ? '#97C459' : '#174A1A',
      },
      background: {
        default: isDark ? '#0D1520' : '#F7F8FA',
        paper:   isDark ? '#192638' : '#FFFFFF',
      },
      text: {
        primary:   isDark ? '#D8DDE7' : '#131F2E',
        secondary: isDark ? '#7E8EA3' : '#4A5E72',
        disabled:  isDark ? '#7E96B0' : '#5A6C82',
      },
      divider: isDark ? 'rgba(184,196,214,0.12)' : '#D8DDE7',
    },

    typography: {
      fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
      htmlFontSize: 15,
      fontSize: 15,
      h1: { fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
      h2: { fontSize: '18px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
      h3: { fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '15px', lineHeight: 1.7 },
      body2: { fontSize: '13px', lineHeight: 1.7 },
      caption: { fontSize: '12px', fontWeight: 500 },
    },

    shape: { borderRadius: 6 },
    spacing: 4,

    components: {

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight:    500,
            fontSize:      '13px',
            minHeight:     '34px',
            padding:       '7px 16px',
            borderRadius:  '6px',
          },
          contained: {
            boxShadow: isDark
              ? '0 2px 6px rgba(74,124,196,0.30), 0 1px 2px rgba(0,0,0,0.20)'
              : '0 2px 6px rgba(30,77,140,0.30), 0 1px 2px rgba(0,0,0,0.10)',
            '&:hover': {
              boxShadow: isDark
                ? '0 3px 8px rgba(74,124,196,0.40), 0 1px 3px rgba(0,0,0,0.25)'
                : '0 3px 8px rgba(30,77,140,0.35), 0 1px 3px rgba(0,0,0,0.12)',
            },
            '&.MuiButton-containedError': {
              backgroundColor: isDark ? '#3D1212' : '#FDEEEE',
              color:           isDark ? '#F09595' : '#7A1515',
              boxShadow:       'none',
              '&:hover': {
                backgroundColor: isDark ? '#4D1818' : '#FAD9D9',
                boxShadow:       'none',
              },
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover':   { borderWidth: '1.5px' },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            boxShadow:    'none',
            border:       isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #D8DDE7',
            background:   isDark ? '#192638' : '#FFFFFF',
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '4px',
            fontWeight:   500,
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius:    '6px',
            fontSize:        '13px',
            backgroundColor: isDark ? '#121E2E' : '#FFFFFF',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#4A7CC4' : '#B0BACA',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#4A7CC4' : '#1E4D8C',
              borderWidth: '1px',
            },
          },
          notchedOutline: { borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D8DDE7' },
          input: {
            padding: '8px 12px',
            color:   isDark ? '#D8DDE7' : '#131F2E',
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? '#121E2E' : '#EDF0F5',
              color:           isDark ? '#94A3B8' : '#4A5E72',
              fontWeight:      600,
              fontSize:        '11px',
              letterSpacing:   '0.04em',
              textTransform:   'uppercase',
              borderBottom:    isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid #D8DDE7',
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#EDF0F5',
            color:       isDark ? '#E2E8F0' : '#131F2E',
            fontSize:    '13px',
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F7F8FA',
            },
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#192638' : '#FFFFFF',
          },
        },
      },

      MuiDialogTitle: {
        styleOverrides: {
          root: {
            color:      isDark ? '#E2E8F0' : '#131F2E',
            fontSize:   '15px',
            fontWeight: 600,
          },
        },
      },

      MuiLink: {
        defaultProps: { underline: 'hover' },
        styleOverrides: {
          root: { color: isDark ? '#4A7CC4' : '#1A6FC4' },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: { borderColor: isDark ? 'rgba(255,255,255,0.10)' : '#D8DDE7' },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#192638' : '#FFFFFF',
          },
        },
      },

    },

  })
}

export const adminTheme     = createAdminTheme('light')
export const adminDarkTheme = createAdminTheme('dark')
export default adminTheme
