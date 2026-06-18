export const getThemeColors = (theme) => {
  const isLight = theme === 'light';
  return {
    pageBg: isLight ? '#e8e6dd' : '#272822',
    cardBg: isLight ? '#d8d5c6' : '#1e1f1a',
    cardAltBg: isLight ? '#d0cdc0' : '#2d2c28',
    navBg: isLight ? '#c8c5b8' : '#1e1f1a',
    border: isLight ? '#b0ab94' : '#75715e',
    borderLight: isLight ? '#c2bda6' : '#3e3d32',
    shadow: isLight ? '4px 4px 0 #c2bda6' : '4px 4px 0 #3e3d32',
    text: isLight ? '#2c2c2a' : '#f8f8f2',
    textMuted: isLight ? '#6b6a63' : '#75715e',
    tagBg: isLight ? '#c2bda6' : '#3e3d32',
    yellow: isLight ? '#8b7500' : '#e6db74',
    green: isLight ? '#4a7a0c' : '#a6e22e',
    isLight,
  };
};