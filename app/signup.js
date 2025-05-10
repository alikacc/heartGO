// import { StyleSheet, Text, View, TouchableOpacity} from "react-native";
// import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
// import { app } from "../firebaseConfig.js";


// export default function App() {
//     function signUp() {
//         const auth = getAuth(app);

//         createUserWithEmailAndPassword(
//             auth,
//             "jane.doe@example.com",
//             "SuperSecretPassword!"
//         )
//             .then((res) => console.log(res))
//             .catch((err) => console.log(err));
            
//     }

//     function login() {
//         const auth = getAuth(app);

//         signInWithEmailAndPassword(
//             auth,
//             "jane.doe@example.com",
//             "SuperSecretPassword!"
//         )
//             .then((res) => console.log(res))
//             .catch((err) => console.log(err));
            
//     }




//     return (
//         <View style={styles.container}>
//             <Text style={styles.text}>Check For Firebase Integration!</Text>
//                 <TouchableOpacity style={styles.button_container} onPress={signUp}>
//                 <Text style={styles.button_text}>SignUp</Text>
//             </TouchableOpacity>
//             <Text style={styles.text}>Check For Firebase Integration!</Text>
//                 <TouchableOpacity style={styles.button_container} onPress={login}>
//                 <Text style={styles.button_text}>SignUp</Text>
//             </TouchableOpacity>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: "center",
//         marginTop: 48,
//     },
//     text: {
//         fontWeight:"bold",
//         textAlign:"center",
//         fontSize:24,
//     },
//     button_text: {
//         textAlign:"center",
//         fontSize:24,
//         color:"#1976d2"
//     },
//     button_container: {
//         borderRadius: 15,
//         flexDirection: "row",
//         margin: 16,
//         padding:24,
//         justifyContent:"center",
//         backgroundColor:"#e6e6e6"
//     },
// });

// SignUpScreen.tsx

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
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const auth = getAuth(app);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();
  const handleSignUp = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // maybe navigate on success...
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // maybe navigate on success...
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
        <Text style={styles.subtitle}>Sign up to continue</Text>

        {/* Inputs */}
        <View style={styles.form}>
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
          {/* <TextInput
            style={styles.input}
            placeholder="Kode Akses"
            placeholderTextColor="#999"
            value={accessCode}
            onChangeText={setAccessCode}
          /> */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.signInLink} onPress={() => router.push('/login')}>
              Sign in
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
    marginTop: 4,
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
  signInLink: {
    color: '#09f',
    fontWeight: '600',
  },
});
