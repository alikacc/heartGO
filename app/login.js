// app/login.tsx

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const auth = getAuth(app);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // on success, go to home
      router.replace('/home');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo */}
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
        />

        {/* Title */}
        <Text style={styles.title}>heartGO</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Form */}
        <View style={styles.form}>
          {!!error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Don’t have an account?{' '}
            <Text 
              style={styles.signUpLink}
              onPress={() => router.push('/signup')}
            >
              Sign up
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f6fc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginTop: 40,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#09f',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#09f',
    paddingHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    color: '#333',
  },
  error: {
    color: '#f33',
    fontSize: 12,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#09f',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#09f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#555',
  },
  signUpLink: {
    color: '#09f',
    fontWeight: '600',
  },
});
