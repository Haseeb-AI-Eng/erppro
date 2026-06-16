import React from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '../store/authStore'

export default function DashboardScreen({ navigation }) {
  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('refreshToken')
    useAuthStore.getState().logout()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button title="Employees" onPress={() => navigation.navigate('Employees')} />
      <View style={{ height: 12 }} />
      <Button title="Sign out" onPress={handleSignOut} />
    </View>
  )
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', padding: 16 }, title: { fontSize: 24, marginBottom: 16, textAlign: 'center' } })
