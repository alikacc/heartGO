import { StyleSheet } from 'react-native';
import { theme } from '../theme';

export const homeStyles = StyleSheet.create({
    // Connection
    connectionContainer: {
        flexDirection: 'row',
        padding: 15
    },
    connectionText: {
        fontSize: 14,
        fontFamily: theme.fonts.regular,
        color: '#333'
    },
    connectedText: {
        fontSize: 14,
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold
    },

    // Date picker - updated to match historical styles
    dateTriggerWrapper: {
        paddingHorizontal: 15,
        marginVertical: 10,
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    datePickerContent: {
        flex: 1,
    },
    datePickerLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginBottom: 2,
    },
    datePickerText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    datePickerIcon: {
        fontSize: 18,
        color: '#333',
    },

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
    todayButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#09f',
        borderRadius: 20,
    },
    todayButtonText: {
        color: '#fff',
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        fontSize: 14,
    },
    closeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    closeButtonText: {
        color: '#09f',
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        fontSize: 16,
    },
    calendar: {
        paddingHorizontal: 10,
    },

    // Filters
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        marginBottom: 10
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#EEE',
        marginRight: 10
    },
    activeFilter: {
        backgroundColor: '#09f'
    },
    filterText: {
        fontSize: 14,
        fontFamily: theme.fonts.regular,
        color: '#333'
    },
    activeFilterText: {
        color: '#fff',
        fontFamily: theme.fonts.medium
    },

    // Parameters
    parametersContainer: {
        flex: 1
    },
    parametersContentContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingBottom: 20
    },

    parameterBox: {
        flexBasis: '48%',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    parameterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    parameterTitle: {
        fontSize: 16,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: '#36f'
    },
    parameterArrow: {
        fontSize: 18,
        color: '#36f'
    },

    parameterValueContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 8
    },
    parameterValue: {
        fontSize: 28,
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        marginRight: 8
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    parameterUnit: {
        fontSize: 18,
        fontFamily: theme.fonts.regular,
        color: '#666'
    },
    parameterStatus: {
        fontSize: 18,
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold
    },
    normalStatus: {
        color: '#00CC00'
    },
    abnormalStatus: {
        color: '#FF0000'
    },

    historyContainer: {
        marginBottom: 8
    },
    historyTitle: {
        fontSize: 12,
        fontFamily: theme.fonts.semiBold,
        fontWeight: theme.fonts.weights.semiBold,
        color: '#666',
        marginBottom: 4,
        marginTop: 4
    },
    historyItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    historyItem: {
        fontSize: 12,
        fontFamily: theme.fonts.regular,
        color: '#666',
        flex: 1
    },
    statusCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8
    },
    normalCircle: {
        backgroundColor: '#00CC00'
    },
    abnormalCircle: {
        backgroundColor: '#FF0000'
    },

    infoBox: {
        backgroundColor: '#E8F4FF',
        borderRadius: 8,
        padding: 8
    },
    infoTitle: {
        fontSize: 12,
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        color: '#09f'
    },
    infoText: {
        fontSize: 12,
        fontFamily: theme.fonts.regular,
        color: '#09f'
    },

    noMeasurementContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    noMeasurementText: {
        fontSize: 18,
        fontFamily: theme.fonts.regular,
        color: '#666',
        textAlign: 'center',
    },

    warningsContainer: {
        padding: 16,
        paddingBottom: 8,
        backgroundColor: '#F8F9FA',
        width: '100%'
    },
    warningBox: {
        backgroundColor: '#FFF0F0',
        borderRadius: 8,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#FFD0D0'
    },
    warningText: {
        fontSize: 14,
        fontFamily: theme.fonts.regular,
        color: '#FF0000',
        textAlign: 'center',
        lineHeight: 20
    },
    warningBoldText: {
        fontFamily: theme.fonts.bold,
        fontWeight: theme.fonts.weights.bold,
        color: '#FF0000'
    },
});
