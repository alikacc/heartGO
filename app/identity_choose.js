// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   TouchableOpacity, 
//   StyleSheet, 
//   Platform,
//   SafeAreaView,
//   StatusBar,
//   Dimensions
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Calendar } from '@/components/ui/calendar';
// import { Slider } from '@/components/ui/slider';
// import { format } from 'date-fns';
// import NavigationBar from '../components/NavigationBar';

// const IdentityChoose = () => {
//   const router = useRouter();
  
//   // State for user selections
//   const [selectedGender, setSelectedGender] = useState<string | null>(null);
//   const [birthdate, setBirthdate] = useState<Date | undefined>(new Date());
//   const [height, setHeight] = useState<number>(180);
//   const [weight, setWeight] = useState<number>(80);
//   const [showCalendar, setShowCalendar] = useState<boolean>(false);
  
//   // Handle next button press
//   const handleNext = () => {
//     if (!selectedGender || !birthdate) {
//       alert('Please complete all fields');
//       return;
//     }
    
//     // Navigate to profile with user data
//     router.push('/profile', { 
//       state: { 
//         gender: selectedGender, 
//         birthdate: birthdate, 
//         height: height, 
//         weight: weight 
//       } 
//     });
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Title */}
//       <Text style={styles.title}>Tell us more...</Text>
      
//       {/* Gender Selection */}
//       <View style={styles.genderContainer}>
//         <TouchableOpacity
//           style={[styles.genderButton, selectedGender === 'Male' && styles.selectedGender]}
//           onPress={() => setSelectedGender('Male')}
//         >
//           <Text style={styles.genderIcon}>⚧</Text>
//           {selectedGender === 'Male' && (
//             <View style={styles.checkmark}>
//               <Text style={styles.checkmarkText}>✓</Text>
//             </View>
//           )}
//           <Text style={styles.genderLabel}>Male</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity
//           style={[styles.genderButton, selectedGender === 'Female' && styles.selectedGender]}
//           onPress={() => setSelectedGender('Female')}
//         >
//           <Text style={styles.genderIcon}>⚧</Text>
//           {selectedGender === 'Female' && (
//             <View style={styles.checkmark}>
//               <Text style={styles.checkmarkText}>✓</Text>
//             </View>
//           )}
//           <Text style={styles.genderLabel}>Female</Text>
//         </TouchableOpacity>
//       </View>
      
//       {/* Birthdate Selection */}
//       <Text style={styles.sectionTitle}>Birthdate</Text>
//       <TouchableOpacity
//         style={styles.dateButton}
//         onPress={() => setShowCalendar(!showCalendar)}
//       >
//         <Text style={styles.calendarIcon}>📅</Text>
//         <Text style={styles.dateText}>{birthdate ? format(birthdate, 'MMM dd, yyyy') : 'Select a date'}</Text>
//         <Text style={styles.arrowIcon}>▼</Text>
//       </TouchableOpacity>
      
//       {/* Calendar for date selection */}
//       {showCalendar && (
//         <View style={styles.calendarContainer}>
//           <Calendar
//             mode="single"
//             selected={birthdate}
//             onSelect={(date) => {
//               setBirthdate(date);
//               setShowCalendar(false);
//             }}
//             initialFocus
//           />
//         </View>
//       )}
      
//       {/* Height Slider */}
//       <Text style={styles.sectionTitle}>Height</Text>
//       <View style={styles.sliderContainer}>
//         <Text style={styles.rangeLabel}>50cm</Text>
//         <View style={styles.sliderWrapper}>
//           <Text style={styles.metricIcon}>👤</Text>
//           <View style={styles.sliderInner}>
//             <Slider
//               defaultValue={[180]}
//               min={50}
//               max={250}
//               step={1}
//               onValueChange={([value]) => setHeight(value)}
//             />
//             <Text style={styles.sliderValue}>{height}cm</Text>
//           </View>
//           <Text style={styles.metricIcon}>👤</Text>
//         </View>
//         <Text style={styles.rangeLabel}>250cm</Text>
//       </View>
      
//       {/* Weight Slider */}
//       <Text style={styles.sectionTitle}>Weight</Text>
//       <View style={styles.sliderContainer}>
//         <Text style={styles.rangeLabel}>20kg</Text>
//         <View style={styles.sliderWrapper}>
//           <Text style={styles.metricIcon}>⚖️</Text>
//           <View style={styles.sliderInner}>
//             <Slider
//               defaultValue={[80]}
//               min={20}
//               max={200}
//               step={1}
//               onValueChange={([value]) => setWeight(value)}
//             />
//             <Text style={styles.sliderValue}>{weight}kg</Text>
//           </View>
//           <Text style={styles.metricIcon}>⚖️</Text>
//         </View>
//         <Text style={styles.rangeLabel}>200kg</Text>
//       </View>
      
//       {/* Next Button */}
//       <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//         <Text style={styles.nextButtonIcon}>→</Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     padding: 20,
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 30,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginTop: 20,
//     marginBottom: 10,
//   },
//   genderContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 20,
//   },
//   genderButton: {
//     width: 120,
//     height: 120,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     backgroundColor: '#fff',
//   },
//   selectedGender: {
//     backgroundColor: '#33a9ff',
//     borderColor: '#33a9ff',
//   },
//   genderIcon: {
//     fontSize: 40,
//     marginBottom: 10,
//   },
//   genderLabel: {
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   checkmark: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: 'black',
//     borderRadius: 10,
//     width: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   checkmarkText: {
//     color: 'white',
//     fontSize: 12,
//   },
//   dateButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 15,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   calendarIcon: {
//     marginRight: 10,
//     fontSize: 18,
//   },
//   dateText: {
//     flex: 1,
//     fontSize: 16,
//   },
//   arrowIcon: {
//     fontSize: 12,
//   },
//   calendarContainer: {
//     marginVertical: 10,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     backgroundColor: '#fff',
//     padding: 10,
//     zIndex: 1000,
//   },
//   sliderContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   sliderWrapper: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginHorizontal: 10,
//   },
//   sliderInner: {
//     flex: 1,
//     marginHorizontal: 10,
//   },
//   rangeLabel: {
//     width: 50,
//     fontSize: 12,
//     color: '#666',
//   },
//   sliderValue: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginTop: 10,
//   },
//   metricIcon: {
//     fontSize: 18,
//   },
//   nextButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     backgroundColor: '#33a9ff',
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   nextButtonIcon: {
//     fontSize: 24,
//     color: '#fff',
//   },
// });

// export default IdentityChoose;
