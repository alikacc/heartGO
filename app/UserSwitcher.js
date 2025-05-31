import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    TextInput,
    Modal,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from './UserContext';
import Header from './component/header';

export default function UserSwitcherScreen() {
    const { currentUser, users, switchUser, addUser, deleteUser } = useUser();
    const router = useRouter();
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        gender: 'male',
        height: '',
        weight: '',
        birthday: ''
    });

    // Check if maximum users reached
    const maxUsersReached = users.length >= 3;

    const handleUserSelect = (userId) => {
        switchUser(userId);
        router.back();
    };

    const handleAddUser = async () => {
        if (maxUsersReached) {
            Alert.alert('Limit Reached', 'Maximum 3 users allowed. Please delete a user first.');
            return;
        }

        if (!newUser.name || !newUser.height || !newUser.weight || !newUser.birthday) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        const success = await addUser(newUser);
        if (success) {
            setNewUser({ name: '', gender: 'male', height: '', weight: '', birthday: '' });
            setShowAddUser(false);
            Alert.alert('Success', 'User added successfully');
        } else {
            Alert.alert('Error', 'Failed to add user');
        }
    };

    const handleDeleteUser = (userId) => {
        if (users.length <= 1) {
            Alert.alert('Error', 'Cannot delete the last user');
            return;
        }

        Alert.alert(
            'Delete User',
            'Are you sure? This will permanently delete all data for this user.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteUser(userId);
                        if (!success) {
                            Alert.alert('Error', 'Failed to delete user');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="User Profile" showUserSwitcher={false} />

            <ScrollView style={styles.content}>
                {/* Current User Info */}
                <View style={styles.currentUserSection}>
                    <Text style={styles.sectionTitle}>Current User</Text>
                    <View style={styles.userCard}>
                        <View style={styles.userHeader}>
                            <Ionicons
                                name={currentUser.gender === 'male' ? 'man' : 'woman'}
                                size={24}
                                color="#09f"
                            />
                            <Text style={styles.userName}>{currentUser.name}</Text>
                        </View>

                        <View style={styles.bioData}>
                            <View style={styles.bioItem}>
                                <Ionicons name="body" size={20} color="#666" />
                                <Text style={styles.bioLabel}>Height:</Text>
                                <Text style={styles.bioValue}>{currentUser.height}</Text>
                            </View>

                            <View style={styles.bioItem}>
                                <Ionicons name="fitness" size={20} color="#666" />
                                <Text style={styles.bioLabel}>Weight:</Text>
                                <Text style={styles.bioValue}>{currentUser.weight}</Text>
                            </View>

                            <View style={styles.bioItem}>
                                <Ionicons name="calendar" size={20} color="#666" />
                                <Text style={styles.bioLabel}>Birthday:</Text>
                                <Text style={styles.bioValue}>{formatDate(currentUser.birthday)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Switch User Section */}
                <View style={styles.switchSection}>
                    <Text style={styles.sectionTitle}>Switch User</Text>
                    {users.map((user) => (
                        <View key={user.id} style={styles.userRow}>
                            <TouchableOpacity
                                style={[
                                    styles.userItem,
                                    currentUser.id === user.id && styles.activeUser
                                ]}
                                onPress={() => handleUserSelect(user.id)}
                            >
                                <Ionicons
                                    name={user.gender === 'male' ? 'man' : 'woman'}
                                    size={20}
                                    color="#666"
                                />
                                <Text style={styles.switchUserName}>{user.name}</Text>
                                {currentUser.id === user.id && (
                                    <Ionicons name="checkmark-circle" size={20} color="#09f" />
                                )}
                            </TouchableOpacity>
                            {users.length > 1 && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteUser(user.id)}
                                >
                                    <Ionicons name="trash" size={20} color="#ff4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            maxUsersReached && styles.addButtonDisabled
                        ]}
                        onPress={() => {
                            if (maxUsersReached) {
                                Alert.alert('Limit Reached', 'Maximum 3 users allowed. Please delete a user first.');
                                return;
                            }
                            setShowAddUser(true);
                        }}
                        disabled={maxUsersReached}
                    >
                        <Ionicons
                            name="add"
                            size={20}
                            color={maxUsersReached ? '#ccc' : '#09f'}
                        />
                        <Text style={[
                            styles.addButtonText,
                            maxUsersReached && styles.addButtonTextDisabled
                        ]}>
                            {maxUsersReached ? 'Maximum Users Reached (3/3)' : `Add New User (${users.length}/3)`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Add User Modal */}
            <Modal visible={showAddUser} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New User</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            value={newUser.name}
                            onChangeText={(text) => setNewUser(prev => ({ ...prev, name: text }))}
                        />

                        <View style={styles.genderRow}>
                            <TouchableOpacity
                                style={[styles.genderButton, newUser.gender === 'male' && styles.genderSelected]}
                                onPress={() => setNewUser(prev => ({ ...prev, gender: 'male' }))}
                            >
                                <Ionicons name="man" size={20} color={newUser.gender === 'male' ? '#fff' : '#666'} />
                                <Text style={[styles.genderText, newUser.gender === 'male' && styles.genderTextSelected]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.genderButton, newUser.gender === 'female' && styles.genderSelected]}
                                onPress={() => setNewUser(prev => ({ ...prev, gender: 'female' }))}
                            >
                                <Ionicons name="woman" size={20} color={newUser.gender === 'female' ? '#fff' : '#666'} />
                                <Text style={[styles.genderText, newUser.gender === 'female' && styles.genderTextSelected]}>Female</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Height (e.g., 175 cm)"
                            value={newUser.height}
                            onChangeText={(text) => setNewUser(prev => ({ ...prev, height: text }))}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Weight (e.g., 70 kg)"
                            value={newUser.weight}
                            onChangeText={(text) => setNewUser(prev => ({ ...prev, weight: text }))}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Birthday (YYYY-MM-DD)"
                            value={newUser.birthday}
                            onChangeText={(text) => setNewUser(prev => ({ ...prev, birthday: text }))}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddUser(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleAddUser}
                            >
                                <Text style={styles.saveButtonText}>Add User</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    currentUserSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    bioData: {
        gap: 12,
    },
    bioItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bioLabel: {
        fontSize: 16,
        color: '#666',
        marginLeft: 8,
        minWidth: 80,
    },
    bioValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    switchSection: {
        marginBottom: 24,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    activeUser: {
        backgroundColor: '#f0f8ff',
        borderWidth: 1,
        borderColor: '#09f',
    },
    switchUserName: {
        fontSize: 16,
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    deleteButton: {
        marginLeft: 8,
        padding: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f8ff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#09f',
        borderStyle: 'dashed',
        marginTop: 8,
    },
    addButtonText: {
        fontSize: 16,
        color: '#09f',
        marginLeft: 8,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    genderRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
    },
    genderButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    genderSelected: {
        backgroundColor: '#09f',
        borderColor: '#09f',
    },
    genderText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    genderTextSelected: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    saveButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#09f',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    addButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#ddd',
        opacity: 0.6,
    },
    addButtonTextDisabled: {
        color: '#ccc',
    },
});