import { createTheme } from '@mui/material/styles';

const adminTheme = createTheme({

  palette: {
    primary: {
      main: '#1E4D8C',
      dark: '#163A6B',
    },
    secondary: {
      main: '#4A6880',
      dark: '#3A5468',
    },
    error: {
      main:         '#D32F2F',
      light:        '#FDEEEE',
      contrastText: '#7A1515',
    },
    warning: {
      main:         '#A67C00',
      light:        '#FFFBE6',
      contrastText: '#6B5000',
    },
    success: {
      main:         '#2E7D32',
      light:        '#EDFAF0',
      contrastText: '#174A1A',
    },
    background: {
      default: '#F7F8FA',
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#131F2E',
      secondary: '#5A6C82',
      disabled:  '#7E8EA3',
    },
    divider: '#D8DDE7',
  },

  typography: {
    fontFamily: "var(--font-literata, 'Literata', Georgia, serif)",
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
          fontFamily:    "var(--font-literata, 'Literata', Georgia, serif)",
        },
        contained: {
          boxShadow: '0 2px 6px rgba(30,77,140,0.30), 0 1px 2px rgba(0,0,0,0.10)',
          '&:hover': { boxShadow: '0 3px 8px rgba(30,77,140,0.35), 0 1px 3px rgba(0,0,0,0.12)' },
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
          border:       '1px solid #D8DDE7',
          background:   '#FFFFFF',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          fontFamily:   "var(--font-literata, 'Literata', Georgia, serif)",
          fontWeight:   500,
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius:    '6px',
          fontSize:        '13px',
          fontFamily:      "var(--font-literata, 'Literata', Georgia, serif)",
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#B0BACA' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1E4D8C',
            borderWidth: '1px',
          },
        },
        notchedOutline: { borderColor: '#D8DDE7' },
        input: { padding: '8px 12px', color: '#131F2E' },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#EDF0F5',
            color:           '#5A6C82',
            fontWeight:      600,
            fontSize:        '11px',
            letterSpacing:   '0.04em',
            textTransform:   'uppercase',
            borderBottom:    '1px solid #D8DDE7',
            fontFamily:      "var(--font-literata, 'Literata', Georgia, serif)",
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#EDF0F5',
          fontFamily:  "var(--font-literata, 'Literata', Georgia, serif)",
          color:       '#131F2E',
          fontSize:    '13px',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F7F8FA' },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { fontFamily: "var(--font-literata, 'Literata', Georgia, serif)" },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: "var(--font-literata, 'Literata', Georgia, serif)",
          color:      '#131F2E',
          fontSize:   '15px',
          fontWeight: 600,
        },
      },
    },

    MuiTypography: {
      styleOverrides: {
        root: { fontFamily: "var(--font-literata, 'Literata', Georgia, serif)" },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#D8DDE7' },
      },
    },

  },

});

export default adminTheme;
