import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';

// Import start screens
import AwarenessScreen from './screens/startScreens/AwarnessScreen';
import StreamScreen from './screens/startScreens/ALStreamScreen';
import SpecializationScreen from './screens/startScreens/SpecializationScreen';
import CareerSuggestionScreen from './screens/startScreens/CareerSuggestionScreen';
import RequiredSkillScreen from './screens/startScreens/RequiredSkillScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LogIn"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="LogIn" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Awareness" component={AwarenessScreen} />
        <Stack.Screen name="Stream" component={StreamScreen} />
        <Stack.Screen name="Specialization" component={SpecializationScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CareerSuggestions" component={CareerSuggestionScreen} />
        <Stack.Screen name="RequiredSkills" component={RequiredSkillScreen} />

      </Stack.Navigator> 
    </NavigationContainer>
  );
};

export default AppNavigator;
