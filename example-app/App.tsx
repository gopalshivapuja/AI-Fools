import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { initBharatEngine, BharatSignals } from '@bharat-engine/sdk';

// Define the inference type locally for now to avoid circular deps or complex builds
interface EngineResponse {
    user_segment: string;
    recommended_mode: string;
    message: string;
}

export default function App() {
  const [signals, setSignals] = useState<BharatSignals | null>(null);
  const [inference, setInference] = useState<EngineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const runEngine = async () => {
    setLoading(true);
    try {
        console.log("App: Requesting engine start...");
        const data = await initBharatEngine();
        setSignals(data.signals);
        setInference(data.inference);
      } catch (e) {
        console.error("App: Error initializing engine", e);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    runEngine();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🇮🇳 Bharat Engine</Text>
        <Text style={styles.subtitle}>Context Debugger</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#ff9933" />
            <Text style={{marginTop: 10}}>Consulting Munim Ji...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
           {/* INFERENCE CARD (New!) */}
           <View style={[styles.card, { borderColor: '#138808', borderWidth: 2 }]}>
            <Text style={[styles.cardTitle, { color: '#138808' }]}>🤖 Brain (Inference)</Text>
            <Text style={styles.label}>Segment:</Text>
            <Text style={styles.value}>{inference?.user_segment}</Text>
            
            <Text style={styles.label}>Mode:</Text>
            <Text style={styles.value}>{inference?.recommended_mode}</Text>

            <Text style={styles.label}>Message:</Text>
            <Text style={styles.info}>{inference?.message}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📡 Network</Text>
            <Text>Type: {signals?.network.type}</Text>
            <Text>Connected: {signals?.network.isInternetReachable ? '✅' : '❌'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>📱 Device</Text>
            <Text>Class: {signals?.device.deviceType}</Text>
            <Text>Model: {signals?.device.modelName}</Text>
          </View>

          <Button title="Refresh Context" onPress={runEngine} color="#000080" />
          <View style={{height: 30}} />
        </ScrollView>
      )}
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#138808', // India Green
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#ff9933', // Saffron
  },
  label: {
      fontWeight: 'bold',
      marginTop: 5,
      color: '#333'
  },
  value: {
      fontSize: 16,
      marginBottom: 5
  },
  info: {
      fontStyle: 'italic',
      color: '#666'
  }
});
