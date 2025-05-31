import { StyleSheet, Platform, StatusBar } from 'react-native';
import { theme } from './theme';

export const sharedStyles = StyleSheet.create({
    // Layout
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
        // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    // Typography
    pageTitle: {
        fontSize: theme.fontSizes['3xl'],
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
    },
    headerText: {
        fontSize: theme.fontSizes.xl,
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        color: theme.colors.text,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    bodyText: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.regular,
        fontWeight: theme.fonts.weights.regular,
        color: theme.colors.text,
    },

    // Cards
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.lg,
        marginVertical: theme.spacing.sm,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Buttons
    primaryButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: theme.colors.surface,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        fontSize: theme.fontSizes.lg,
    },

    // Modal
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        paddingBottom: 34,
        maxHeight: '80%',
    },

    // Table
    tableContainer: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.base,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },

    // Utilities
    flexRow: { flexDirection: 'row' },
    flexCenter: { justifyContent: 'center', alignItems: 'center' },
    textCenter: { textAlign: 'center' },
    textBold: {
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
    },
    textMuted: {
        color: theme.colors.textSecondary,
        fontFamily: theme.fonts.regular,
    },
});
