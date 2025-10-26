import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, AccessibilityInfo } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const BottomNav = () => {
  const navigation = useNavigation();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [selectedTab, setSelectedTab] = useState(null);
  const [lastTap, setLastTap] = useState(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  const tabs = [
    { name: 'Home', icon: 'home', screen: 'HyUserScreen' },
    { name: 'Check Career', icon: 'target', screen: 'SuggestCareer' },
    { name: 'Map', icon: 'map', screen: 'LandMapScreen' },
    { name: 'Profile', icon: 'user', screen: 'UserProfile' },
  ];

  const handleTabPress = (tab) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 200; 

    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY && selectedTab === tab.name) {
      navigation.navigate(tab.screen);
      setSelectedTab(null);
    } else {
      setSelectedTab(tab.name);
    }
    setLastTap(now);
  };

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => (
        <View key={tab.name} style={styles.tabContainer}>
          <Animatable.View
            animation={selectedTab === tab.name && !reduceMotion ? 'pulse' : undefined}
            duration={500}
          >
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabPress(tab)}
              accessibilityLabel={`${tab.name} Tab`}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Icon
                name={tab.icon}
                size={24}
                color={selectedTab === tab.name ? '#E1C16E' : '#E0E0E0'}
              />
            </TouchableOpacity>
          </Animatable.View>
          {selectedTab === tab.name && (
            <Animatable.Text
              animation={reduceMotion ? undefined : 'fadeIn'}
              duration={300}
              style={styles.tabTitle}
              accessibilityLabel={`${tab.name} Title`}
            >
              {tab.name}
            </Animatable.Text>
          )}
        </View>
      ))}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 212, 180, 0.2)',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    width: width,
  },
  tabContainer: {
    alignItems: 'center',
  },
  tabButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#1E1E1E',
    elevation: 4,
    shadowColor: '#E1C16E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tabTitle: {
    fontSize: 12,
    fontFamily: 'Digital-7 Mono',
    color: '#E1C16E',
    marginTop: 5,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    textShadowColor: 'rgba(0, 212, 180, 0.3)',
  },
});