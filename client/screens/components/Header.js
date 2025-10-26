import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, AccessibilityInfo } from 'react-native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import BASE_URL from "../../config/apiConfig";

const { width } = Dimensions.get('window');

const Header = () => {
  const navigation = useNavigation(); // Access navigation
  const [reduceMotion, setReduceMotion] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [username, setUsername] = useState('Guest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for reduced motion accessibility setting
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      setReduceMotion(enabled);
    });

    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }

    // Fetch username
    const fetchUsername = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setUsername('Guest');
          setLoading(false);
          return;
        }
        const response = await axios.get(`${BASE_URL}/api/auth/get-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(response.data.username);
      } catch (error) {
        console.error('Failed to fetch user:', error.message);
        setUsername('Unknown');
      } finally {
        setLoading(false);
      }
    };
    fetchUsername();
  }, []);

  return (
    <SafeAreaView style={styles.headerContainer}>
      <Animatable.View
        animation={reduceMotion ? undefined : 'fadeIn'}
        duration={800}
        style={styles.headerContent}
      >
        {loading ? (
          <Text style={styles.greeting}>Loading...</Text>
        ) : (
          <Text
            style={styles.greeting}
            accessibilityLabel={`${greeting}, ${username}`}
            accessibilityRole="text"
          >
            {greeting}, {username}
          </Text>
        )}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserProfile')} 
          activeOpacity={0.8}
          accessibilityLabel="Profile Button"
          accessibilityRole="button"
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </Animatable.View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#121212',
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: width,
  },
  greeting: {
    fontSize: 18,
    fontFamily: 'Digital-7 Mono',
    fontWeight: 'bold',
    color: '#E1C16E',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
    textShadowColor: 'rgba(0, 212, 180, 0.3)',
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#00D4B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    borderColor: '#E1C16E', 
    borderWidth: 3,
    shadowRadius: 6,
  },
  profileButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#E1C16E',
    fontWeight: 'bold',
  },
});