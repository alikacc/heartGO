import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../UserContext';
import { theme } from '../styles/theme';

const Header = ({ title, showUserSwitcher = true }) => {
  const router = useRouter();
  const { currentUser } = useUser();

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <View style={styles.container}>
      {showUserSwitcher ? (
        <>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            style={styles.circle}
            onPress={() => router.push('/UserSwitcher')}
          >
            <Text style={styles.initials}>
              {getInitials(currentUser.name)}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.titleCentered}>{title}</Text>
          <View style={styles.placeholder} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    fontWeight: theme.fonts.weights.medium,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.semiBold,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text,
    flex: 1,
  },
  titleCentered: {
    fontSize: theme.fontSizes.xl,
    fontFamily: theme.fonts.semiBold,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text,
    textAlign: 'center',
    flex: 1,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#09f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
});

export default Header;
