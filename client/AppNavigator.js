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
import LeadershipQuizScreen from './screens/leadershipScreens/LeadershipQuizzScreen';
import LeadershipResultScreen from './screens/leadershipScreens/LeadershipResultScreen';
import LandingScreen from './screens/LandingScreen';
import LoadingScreen from './screens/LandingScreen';
import WelcomeGuideScreen from './screens/WelcomeGuideScreen';

import CareerSkillChart from './screens/career/CareerSkillChart';
import SuggestCareer from './screens/career/SuggestCareer';

import PSskillAssesment from './screens/career/skills/PSskillAssesment';
import ANskillAssesment from './screens/career/skills/ANskillAssesment';
import ARskillAssesment from './screens/career/skills/ARskillAssesment';
import LEskillAssesment from './screens/career/skills/LEskillAssesment';

import ResultScreen from './screens/career/skills/Results/ResultScreen';

import Header from './screens/components/Header';
import NavBar from './screens/components/NavBar';
import UserProfile from './screens/components/UserProfile';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Header" component={Header} />
        <Stack.Screen name="NavBar" component={NavBar} />
        <Stack.Screen name="UserProfile" component={UserProfile} />

        <Stack.Screen name="SuggestCareer" component={SuggestCareer} />
        <Stack.Screen name="CareerSkillChart" component={CareerSkillChart} />

        <Stack.Screen name="PSskillAssesment" component={PSskillAssesment} />
        <Stack.Screen name="LEskillAssesment" component={LEskillAssesment} />
        <Stack.Screen name="ARskillAssesment" component={ARskillAssesment} />
        <Stack.Screen name="ANskillAssesment" component={ANskillAssesment} />

        <Stack.Screen name="ResultScreen" component={ResultScreen} />

        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="WelcomeGuideScreen" component={WelcomeGuideScreen} />
        <Stack.Screen name="LogIn" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Awareness" component={AwarenessScreen} />
        <Stack.Screen name="Stream" component={StreamScreen} />
        <Stack.Screen name="Specialization" component={SpecializationScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CareerSuggestions" component={CareerSuggestionScreen} />
        <Stack.Screen name="RequiredSkills" component={RequiredSkillScreen} />
        <Stack.Screen name="LeadershipQuiz" component={LeadershipQuizScreen} />
        <Stack.Screen name="LeadershipResult" component={LeadershipResultScreen} />

      </Stack.Navigator> 
    </NavigationContainer>
  );
};

export default AppNavigator;
