import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
    colors: {
        primary: '#09f',
        secondary: '#36f',
        background: '#F8F9FA',
        surface: '#FFF',
        text: '#333',
        textSecondary: '#666',
        border: '#E5E5E5',
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        lightBlue: '#E8F4FF',
        shadow: '#000',
    },

    fonts: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        semiBold: 'Poppins-SemiBold',
        bold: 'Poppins-Bold',
        weights: {
            regular: '400',
            medium: '500',
            semiBold: '600',
            bold: '700',
        }
    },

    fontSizes: {
        xs: 10,
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        '3xl': 24,
        '4xl': 28,
        '5xl': 32,
        '6xl': 48,
    },

    spacing: {
        xs: 4,
        sm: 8,
        base: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
    },

    borderRadius: {
        sm: 8,
        base: 12,
        lg: 16,
        xl: 20,
        full: 999,
    },

    dimensions: {
        screenWidth: width,
        screenHeight: height,
    },
};
