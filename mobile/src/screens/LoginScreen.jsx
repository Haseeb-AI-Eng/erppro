import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import api from '../services/api'
import * as SecureStore from 'expo-secure-store'
import { useAuthStore } from '../store/authStore'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      await SecureStore.setItemAsync('token', data.token)
      if (data.refreshToken) await SecureStore.setItemAsync('refreshToken', data.refreshToken)
      useAuthStore.getState().setAuth(data.user || null, data.token, data.refreshToken || null)
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })
    } catch (e) {
      Alert.alert('Login failed', e?.response?.data?.message || e.message)
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      {loading ? <ActivityIndicator /> : <Button title="Login" onPress={handleLogin} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 12 }
})
