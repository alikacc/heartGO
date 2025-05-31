import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const scanDeviceStyles = StyleSheet.create({
    content: {
        padding: theme.spacing.lg
    },

    // Reminders Section
    section: {
        marginBottom: theme.spacing['2xl']
    },
    sectionTitle: {
        fontSize: theme.fontSizes.xl,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm
    },
    bullet: {
        fontSize: theme.fontSizes.lg,
        color: theme.colors.primary,
        marginRight: theme.spacing.sm,
        marginTop: 2
    },
    reminderText: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        flex: 1,
        lineHeight: 20
    },

    // Card styles
    disabledCard: {
        opacity: 0.5
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.base
    },
    cardTitle: {
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: theme.colors.text,
        marginLeft: theme.spacing.base
    },
    disabledText: {
        color: '#ccc'
    },
    disabledHint: {
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs
    },

    // Connection info
    connectedInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    connectedText: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: theme.colors.success,
        marginLeft: theme.spacing.sm
    },

    // Time display
    timeDisplay: {
        fontSize: theme.fontSizes['3xl'],
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        color: theme.colors.text
    },

    // Buttons
    startButton: {
        backgroundColor: theme.colors.success,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl
    },
    disabledButton: {
        backgroundColor: '#ccc'
    },
    buttonText: {
        color: theme.colors.surface,
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        marginLeft: theme.spacing.sm
    },

    // Modal styles - matching historicalStyles.js and homeStyles.js
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    closeButtonText: {
        color: '#09f',
        fontWeight: '600',
        fontSize: 16,
    },

    // Error box
    errorBox: {
        backgroundColor: '#FFEBEE',
        padding: theme.spacing.base,
        margin: theme.spacing.xl,
        borderRadius: theme.borderRadius.sm
    },
    errorText: {
        color: theme.colors.error,
        fontFamily: theme.fonts.regular,
        textAlign: 'center'
    },

    // Scan button
    scanButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.lg,
        margin: theme.spacing.xl,
        alignItems: 'center'
    },

    // Device list
    deviceItem: {
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    deviceName: {
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: theme.colors.text
    },
    deviceId: {
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        marginTop: 2
    },

    // Time selection
    timeOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    selectedOption: {
        backgroundColor: theme.colors.lightBlue
    },
    timeText: {
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.regular,
        color: theme.colors.text
    },
    selectedText: {
        color: theme.colors.primary,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold
    },
}); 