import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';

const Profile = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const userData = {
    gender: params.gender || 'Male',
    birthdate: params.birthdate ? new Date(params.birthdate) : new Date('1860-05-21'),
    height: params.height ? parseInt(params.height) : 180,
    weight: params.weight ? parseInt(params.weight) : 49,
  };

  const formattedBirthdate = userData.birthdate instanceof Date 
    ? format(userData.birthdate, 'dd MMM yyyy') 
    : '21 May 1860';

  const handleBack = () => {
    router.push('/identity');
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      {/* Profile avatar & info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>WE</Text>
        </View>
        <Text style={styles.ownerLabel}>OWNER</Text>
        <Text style={styles.userName}>Willem Einthoven</Text>
        <View style={styles.accessCodeContainer}>
          <Text style={styles.accessCodeText}>ACCESS CODE: TA2425015</Text>
        </View>
      </View>
      
      {/* Profile details */}
      <View style={styles.detailsContainer}>
        {/* Email field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldValue}>willem1234@gmail.com</Text>
          </View>
        </View>
        
        {/* Password field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldValue}>•••</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Gender field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldValue}>{userData.gender}</Text>
          </View>
        </View>
        
        {/* Birthdate field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Birthdate</Text>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldValue}>{formattedBirthdate}</Text>
          </View>
        </View>
        
        {/* Height field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Height</Text>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldValue}>{userData.height} cm</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Weight field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Weight</Text>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldValue}>{userData.weight} kg</Text>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Logout button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33a9ff',
  },
  ownerLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  accessCodeContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  accessCodeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  fieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
  },
  editButton: {
    padding: 5,
  },
  editIcon: {
    fontSize: 18,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#33a9ff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Profile;
