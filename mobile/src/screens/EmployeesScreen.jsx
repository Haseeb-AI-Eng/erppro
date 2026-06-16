import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import api from '../services/api'

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    let mounted = true
    api.get('/employees').then(res => { if (mounted) setEmployees(res.data || []) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employees</Text>
      <FlatList data={employees} keyExtractor={(i) => i._id || String(i.id)} renderItem={({ item }) => (
        <View style={styles.row}><Text>{item.name || item.fullName || item.email}</Text></View>
      )} ListEmptyComponent={<Text>No employees</Text>} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 12 },
  row: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }
})
