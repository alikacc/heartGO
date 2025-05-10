import React from 'react';
import { View } from 'react-native';

// ====== Import the page you want to display ======
import ScanDevice from './scan_device'; 
import Landing from './landing'; 
import Home from './home'; 
import Plot from './plot'; 
import Login from './login'; 
import SignUp from './signup'; 
import Profile from './profile'; 
import IdentityChoose from './identity_choose'; 
// import LandingAzka from './landing_azka/LandingAzka';
// import SomeOtherPage from './someotherpage/SomeOtherPage';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <Home/>
    </View>
  );
}
