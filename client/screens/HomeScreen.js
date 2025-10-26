import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from './components/Header'
import NavBar from './components/NavBar'

const HomeScreen = () => {
  return (
    <>
    <Header/>
    <View>
      <Text>HomeScreen</Text>
    </View>
    <NavBar/>
    </>
    
  )
}

export default HomeScreen

const styles = StyleSheet.create({})