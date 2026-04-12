import { createTheme } from '@mui/material/styles';

const theme = createTheme({

  palette: {
    primary: {
      main:  '#1A6FC4',
      dark:  '#155AA3',
    },
    secondary: {
      main:  '#5A7A96',
      dark:  '#4A6880',
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
      default: '#F5F5F5',  // --surface-0
      paper:   '#FFFFFF',  // --surface-2
    },
    text: {
      primary:   '#1A1A1A',  // --text-primary
      secondary: '#696969',  // --text-secondary
      disabled:  '#A0A0A0',  // --text-disabled
    },
  },

  typography: {
    fontFamily: "var(--font-lora), Georgia, serif",
    h1: {
      fontSize:      '22px',
      fontWeight:    700,
      letterSpacing: '-0.015em',
      lineHeight:    1.3,
    },
    h2: {
      fontSize:      '18px',
      fontWeight:    600,
      letterSpacing: '-0.01em',
      lineHeight:    1.3,
    },
    h3: {
      fontSize:   '15px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize:      '28px',  // page title
      fontWeight:    700,
      letterSpacing: '-0.02em',
      lineHeight:    1.2,
    },
    body1: {
      fontSize:   '14px',  // --text-normal (default body)
      lineHeight: 1.6,
    },
    body2: {
      fontSize:   '12px',  // --text-small
      lineHeight: 1.5,
    },
    caption: {
      fontSize:   '11px',  // --text-label
      fontWeight: 500,
    },
  },

  shape: {
    borderRadius: 8,  // --radius-md; MUI multiplies this for larger variants
  },

  spacing: 4,  // 4px base unit — spacing(1)=4px, spacing(2)=8px etc.

  components: {

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight:    500,
          fontSize:      '14px',
          minHeight:     '36px',
          padding:       '9px 20px',
          borderRadius:  '8px',
        },
        contained: {
          boxShadow: '0 2px 6px rgba(26,111,196,0.35), 0 1px 2px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 3px 10px rgba(26,111,196,0.40), 0 1px 3px rgba(0,0,0,0.15)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize:     '14px',
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A0A0A0',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1A6FC4',
            borderWidth: '1px',
          },
        },
        input: {
          padding: '10px 12px',
          '&::placeholder': {
            color:   '#A8A8A8',
            opacity: 1,
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          color:    '#696969',
          '&.Mui-focused': {
            color: '#1A6FC4',
          },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize:   '12px',
          color:      '#696969',
          marginLeft: 0,
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '10px 12px',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',  // --radius-lg
          boxShadow:    'none',
          border:       '1px solid rgba(0,0,0,0.08)',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px',  // --radius-pill
          fontSize:     '12px',
          height:       '24px',
        },
      },
    },

  },

});

export default theme;