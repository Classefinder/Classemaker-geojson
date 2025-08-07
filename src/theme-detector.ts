// Détecteur de thème pour debugger le mode sombre
const logThemeStatus = () => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const computedStyles = getComputedStyle(document.documentElement);
  
  console.group('🎨 Theme Detection Status');
  console.log(`Dark mode preference: ${isDarkMode ? 'Enabled' : 'Disabled'}`);
  
  // Log des variables CSS importantes
  const cssVars = [
    '--background-color',
    '--secondary-color',
    '--text-color',
    '--primary-color',
    '--border-color'
  ];
  
  console.log('Applied CSS variables:');
  cssVars.forEach(variable => {
    const value = computedStyles.getPropertyValue(variable);
    console.log(`${variable}: ${value || 'not set'}`);
  });
  
  // Vérification de l'application des styles
  const body = document.body;
  const bodyBg = getComputedStyle(body).backgroundColor;
  console.log(`Body background-color: ${bodyBg}`);
  console.groupEnd();
};

// Observer les changements de préférence de thème
const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addListener(logThemeStatus);

// Log initial au chargement
document.addEventListener('DOMContentLoaded', logThemeStatus);

// Log après un court délai pour s'assurer que tous les styles sont chargés
setTimeout(logThemeStatus, 1000);
