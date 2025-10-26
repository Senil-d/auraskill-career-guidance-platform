import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from './components/Header'
import NavBar from './components/NavBar'

const HomeScreen = () => {
  return (
    <>
    <Header/>
    <NavBar/>
    <View>
      <Text>HomeScreen</Text>
    </View>
    
    </>
    
  )
}

export default HomeScreen

const styles = StyleSheet.create({})