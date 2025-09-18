// Jay Kay Digital Press Brand Guidelines
export const BRAND_COLORS = {
  primary: {
    red: '#dc2626',
    redLight: '#ef4444',
    redDark: '#b91c1c',
    redGradient: 'from-red-600 to-red-700',
  },
  secondary: {
    yellow: '#eab308',
    yellowLight: '#fbbf24',
    yellowDark: '#ca8a04',
  },
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
} as const;

export const BRAND_ASSETS = {
  logo: {
    main: '/logo.svg',
    icon: '/logo-icon.svg',
  },
  gradients: {
    primary: 'bg-gradient-to-r from-red-600 to-red-700',
    secondary: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    hero: 'bg-gradient-to-br from-white via-red-50 to-yellow-50',
    accent: 'bg-gradient-to-br from-blue-50 to-indigo-100',
  },
} as const;

export const BRAND_TYPOGRAPHY = {
  fonts: {
    sans: 'var(--font-geist-sans)',
    mono: 'var(--font-geist-mono)',
  },
  sizes: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  },
} as const;

export const COMPANY_INFO = {
  name: 'Jay Kay Digital Press',
  tagline: 'Professional Printing Services',
  motto: 'Quality • Speed • Reliability',
  contact: {
    phone: ['+232 34 788711', '+232 30 741062'],
    email: 'jaykaydigitalpress@gmail.com',
    address: 'St. Edward School Avenue, By Caritas, Freetown, Sierra Leone',
  },
  social: {
    website: 'https://jaykaydigitalpress.com',
  },
} as const;

// CSS Custom Properties for brand colors (to be used in globals.css)
export const BRAND_CSS_VARIABLES = `
  :root {
    --brand-red: ${BRAND_COLORS.primary.red};
    --brand-red-light: ${BRAND_COLORS.primary.redLight};
    --brand-red-dark: ${BRAND_COLORS.primary.redDark};
    --brand-yellow: ${BRAND_COLORS.secondary.yellow};
    --brand-yellow-light: ${BRAND_COLORS.secondary.yellowLight};
    --brand-yellow-dark: ${BRAND_COLORS.secondary.yellowDark};
  }
`;

// Utility function to get brand-consistent button styles
export const getBrandButtonStyles = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
  const baseStyles = 'transition-all duration-200 font-medium';
  
  switch (variant) {
    case 'primary':
      return `${baseStyles} bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700`;
    case 'secondary':
      return `${baseStyles} bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500 hover:border-yellow-600`;
    case 'outline':
      return `${baseStyles} border-red-600 text-red-600 hover:bg-red-600 hover:text-white`;
    case 'ghost':
      return `${baseStyles} text-red-600 hover:bg-red-50`;
    default:
      return baseStyles;
  }
};

// Utility function to get brand-consistent card styles
export const getBrandCardStyles = (variant: 'default' | 'featured' | 'accent' = 'default') => {
  const baseStyles = 'border rounded-lg shadow-sm transition-all duration-200';
  
  switch (variant) {
    case 'featured':
      return `${baseStyles} border-red-200 hover:border-red-300 hover:shadow-lg bg-gradient-to-br from-white to-red-50`;
    case 'accent':
      return `${baseStyles} border-yellow-200 hover:border-yellow-300 hover:shadow-lg bg-gradient-to-br from-white to-yellow-50`;
    default:
      return `${baseStyles} border-gray-200 hover:border-gray-300 hover:shadow-md`;
  }
};