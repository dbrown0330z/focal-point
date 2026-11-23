import { createTheme } from '@mui/material/styles';

const LORA   = "var(--font-lora,   'Lora', Georgia, serif)";
const NUNITO = "var(--font-nunito, 'Nunito', system-ui, sans-serif)";

function createMemberTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  return createTheme({

    palette: {
      mode,
      primary: {
        main: isDark ? '#4A90D4' : '#1A6FC4',
        dark: isDark ? '#5FA0E0' : '#155AA3',
      },
      secondary: {
        main: isDark ? '#6EA8D8' : '#5A7A96',
        dark: isDark ? '#82B8E2' : '#4A6880',
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
        default: isDark ? '#141414' : '#F5F5F5',
        paper:   isDark ? '#292929' : '#FFFFFF',
      },
      text: {
        primary:   isDark ? '#E8E8E8' : '#1A1A1A',
        secondary: isDark ? '#9E9E9E' : '#595959',
        disabled:  isDark ? '#525252' : '#A0A0A0',
      },
      divider: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
    },

    typography: {
      fontFamily: NUNITO,
      h1: {
        fontFamily:    LORA,
        fontSize:      '28px',
        fontWeight:    700,
        letterSpacing: '-0.02em',
        lineHeight:    1.2,
      },
      h2: {
        fontFamily:    NUNITO,
        fontSize:      '17px',
        fontWeight:    700,
        lineHeight:    1.3,
      },
      h3: {
        fontFamily:    NUNITO,
        fontSize:      '15px',
        fontWeight:    600,
        lineHeight:    1.4,
      },
      h4: {
        fontFamily:    LORA,
        fontSize:      '50px',
        fontWeight:    700,
        letterSpacing: '-0.03em',
        lineHeight:    1.1,
      },
      body1: {
        fontFamily: NUNITO,
        fontSize:   '15px',
        lineHeight: 1.65,
      },
      body2: {
        fontFamily: NUNITO,
        fontSize:   '14px',
        lineHeight: 1.6,
      },
      caption: {
        fontFamily:    NUNITO,
        fontSize:      '12px',
        fontWeight:    700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
      },
      overline: {
        fontFamily:    NUNITO,
        fontSize:      '11px',
        fontWeight:    700,
        letterSpacing: '0.08em',
      },
      button: {
        fontFamily:    NUNITO,
        fontWeight:    600,
        fontSize:      '14px',
        textTransform: 'none' as const,
      },
    },

    shape: { borderRadius: 8 },
    spacing: 4,

    components: {

      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily:    NUNITO,
            textTransform: 'none',
            fontWeight:    600,
            fontSize:      '14px',
            minHeight:     '36px',
            padding:       '9px 20px',
            borderRadius:  '8px',
          },
          contained: {
            boxShadow: isDark
              ? '0 2px 6px rgba(74,144,212,0.40), 0 1px 2px rgba(0,0,0,0.25)'
              : '0 2px 6px rgba(26,111,196,0.35), 0 1px 2px rgba(0,0,0,0.12)',
            '&:hover': {
              boxShadow: isDark
                ? '0 3px 10px rgba(74,144,212,0.50), 0 1px 3px rgba(0,0,0,0.30)'
                : '0 3px 10px rgba(26,111,196,0.40), 0 1px 3px rgba(0,0,0,0.15)',
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
            '&:hover': { borderWidth: '1.5px' },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#292929' : '#FFFFFF',
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            fontFamily:      NUNITO,
            borderRadius:    '8px',
            fontSize:        '14px',
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#6EA8D8' : '#A0A0A0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#4A90D4' : '#1A6FC4',
              borderWidth: '1px',
            },
          },
          notchedOutline: {
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.14)',
          },
          input: {
            padding: '10px 12px',
            color:   isDark ? '#E8E8E8' : '#1A1A1A',
            '&::placeholder': {
              color:   isDark ? '#5E5E5E' : '#A8A8A8',
              opacity: 1,
            },
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: NUNITO,
            fontSize:   '14px',
            color:      isDark ? '#9E9E9E' : '#595959',
            '&.Mui-focused': { color: isDark ? '#4A90D4' : '#1A6FC4' },
          },
        },
      },

      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontFamily: NUNITO,
            fontSize:   '12px',
            color:      isDark ? '#9E9E9E' : '#595959',
            marginLeft: 0,
          },
        },
      },

      MuiSelect: {
        styleOverrides: {
          select: { padding: '10px 12px' },
          icon:   { color: isDark ? '#9E9E9E' : undefined },
        },
      },

      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: NUNITO,
            fontSize:   '14px',
            color:      isDark ? '#E8E8E8' : '#1A1A1A',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(74,144,212,0.15)' : 'rgba(26,111,196,0.08)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(74,144,212,0.22)' : 'rgba(26,111,196,0.12)',
              },
            },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow:    'none',
            border:       isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontFamily:    NUNITO,
            borderRadius:  '9999px',
            fontSize:      '11px',
            fontWeight:    700,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            height:        '22px',
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontFamily:      NUNITO,
            fontSize:        '12px',
            backgroundColor: isDark ? '#3A3A3A' : undefined,
          },
        },
      },

    },

  })
}

export const theme     = createMemberTheme('light')
export const darkTheme = createMemberTheme('dark')
export default theme;
