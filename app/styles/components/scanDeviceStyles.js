import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const scanDeviceStyles = StyleSheet.create({
    content: {
        padding: theme.spacing.lg
    },

    // Screen Layout
    screenTitle: {
        fontSize: theme.fontSizes['2xl'],
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm
    },
    screenDescription: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xl
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl
    },
    backButtonText: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.medium,
        color: '#4A90E2',
        marginLeft: theme.spacing.xs
    },

    // Bluetooth Status
    bluetoothContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    bluetoothStatus: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        marginRight: theme.spacing.md
    },
    bluetoothOn: {
        backgroundColor: '#E8F5E9'
    },
    bluetoothOff: {
        backgroundColor: '#FFEBEE'
    },
    bluetoothText: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.medium,
        marginLeft: theme.spacing.sm
    },
    bluetoothTextOn: {
        color: '#4CAF50'
    },
    bluetoothTextOff: {
        color: '#F44336'
    },
    refreshButton: {
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: '#F5F5F5'
    },

    // Section Styles
    section: {
        marginBottom: theme.spacing.xl
    },
    sectionTitle: {
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md
    },

    // Instructions Card
    instructionsCard: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    instructionImage: {
        width: '100%',
        height: 200,
        marginBottom: theme.spacing.md
    },
    instructionText: {
        fontSize: theme.fontSizes.base,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        lineHeight: 24
    },

    // Navigation Buttons
    nextButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl
    },

    // Reminders Section
    disabledSection: {
        opacity: 0.7
    },
    disabledSectionHint: {
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: theme.spacing.md,
        textAlign: 'center'
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
        opacity: 0.6,
        backgroundColor: '#F5F5F5'
    },
    disabledCardHeader: {
        opacity: 0.8
    },
    disabledText: {
        color: '#999'
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

    // Checklist Section
    checklistItem: {
        backgroundColor: '#fff',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledChecklistItem: {
        opacity: 0.5,
    },
    questionContainer: {
        marginBottom: theme.spacing.sm,
    },
    question: {
        fontSize: theme.fontSizes.lg,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    description: {
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.regular,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    checkboxButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: 'transparent',
        minWidth: 80,
        alignItems: 'center',
    },
    activeYesButton: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    activeNoButton: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
    },
    checkboxText: {
        fontSize: theme.fontSizes.sm,
        fontFamily: theme.fonts.medium,
        color: theme.colors.textSecondary,
    },
    activeCheckboxText: {
        color: '#fff',
        fontWeight: theme.fonts.weights.semiBold,
    },
}); 