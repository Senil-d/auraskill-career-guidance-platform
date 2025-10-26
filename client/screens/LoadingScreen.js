import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import * as Animatable from 'react-native-animatable';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/Insider-loading.json')}
        autoPlay
        loop
        style={styles.lottie}
      />

      <Animatable.Text animation="pulse" iterationCount="infinite" style={styles.text}>
      </Animatable.Text>
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: Dimensions.get('window').width * 0.8,
    height: 300,
  },
  text: {
    color: '#00FFD1',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
});
