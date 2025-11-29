import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { initBharatEngine } from '@bharat-engine/sdk';
import type { BharatSignals, EngineResponse, Suggestion } from '@bharat-engine/sdk';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// THEME - India-inspired colors that adapt to mode
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  saffron: '#FF9933',
  white: '#FFFFFF',
  green: '#138808',
  navy: '#000080',
  ashoka: '#000080', // Chakra blue
  
  // Mode-specific backgrounds
  lite: {
    bg: '#FAFAFA',
    card: '#FFFFFF',
    text: '#1A1A1A',
    accent: '#FF9933',
  },
  standard: {
    bg: '#F0F4F8',
    card: '#FFFFFF', 
    text: '#1A1A1A',
    accent: '#138808',
  },
  rich: {
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    card: 'rgba(255,255,255,0.95)',
    text: '#1A1A1A',
    accent: '#764ba2',
  }
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [signals, setSignals] = useState<BharatSignals | null>(null);
  const [inference, setInference] = useState<EngineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [journeyDay, setJourneyDay] = useState(30); // Default to Day 30 for demo
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const runEngine = async (day: number = journeyDay) => {
    setLoading(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    try {
      console.log(`App: Requesting engine start for Day ${day}...`);
      const data = await initBharatEngine(day);
      setSignals(data.signals);
      setInference(data.inference);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (e) {
      console.error("App: Error initializing engine", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEngine();
  }, []);

  // Get mode-based colors
  const mode = inference?.recommended_mode || 'standard';
  const theme = COLORS[mode as keyof typeof COLORS] || COLORS.standard;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#138808' }]}>
        <Text style={styles.loadingEmoji}>🙏</Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Consulting Munim Ji...</Text>
        <Text style={styles.loadingSubtext}>Understanding your context</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HEADER - Greeting & Persona */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.header}>
            <Text style={styles.greeting}>{inference?.greeting}</Text>
            
            <View style={styles.personaContainer}>
              <Text style={styles.personaEmoji}>{inference?.persona.emoji}</Text>
              <View style={styles.personaInfo}>
                <Text style={styles.personaName}>{inference?.persona.name}</Text>
                <Text style={styles.personaDescription}>{inference?.persona.description}</Text>
              </View>
            </View>
            
            {/* Mode Badge */}
            <View style={[styles.modeBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.modeBadgeText}>
                {mode === 'lite' ? '⚡ Lite Mode' : mode === 'rich' ? '✨ Rich Mode' : '🎯 Standard Mode'}
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* JOURNEY PROGRESS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.journeyHeader}>
              <Text style={styles.journeyTitle}>🚀 Your Journey</Text>
              <Text style={styles.journeyDay}>Day {inference?.journey.day}</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min((inference?.journey.day || 0) / 30 * 100, 100)}%`,
                      backgroundColor: theme.accent 
                    }
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, inference?.journey.stage === 'newcomer' && styles.activeLabel]}>Newcomer</Text>
                <Text style={[styles.progressLabel, inference?.journey.stage === 'explorer' && styles.activeLabel]}>Explorer</Text>
                <Text style={[styles.progressLabel, inference?.journey.stage === 'regular' && styles.activeLabel]}>Regular</Text>
                <Text style={[styles.progressLabel, inference?.journey.stage === 'partner' && styles.activeLabel]}>Partner</Text>
              </View>
            </View>
            
            <View style={[styles.valueDelivered, { backgroundColor: `${theme.accent}15` }]}>
              <Text style={styles.valueIcon}>💎</Text>
              <Text style={[styles.valueText, { color: theme.accent }]}>{inference?.journey.value_delivered}</Text>
            </View>
            
            {/* Insights */}
            <View style={styles.insightsContainer}>
              {inference?.journey.insights.map((insight, index) => (
                <View key={index} style={styles.insightBadge}>
                  <Text style={styles.insightText}>✓ {insight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* AI SUGGESTIONS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={styles.sectionTitle}>✨ Suggestions for You</Text>
          
          {inference?.suggestions.map((suggestion: Suggestion, index: number) => (
            <TouchableOpacity 
              key={index}
              style={[styles.suggestionCard, { backgroundColor: theme.card }]}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              </View>
              <Text style={styles.suggestionArrow}>→</Text>
            </TouchableOpacity>
          ))}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CONTEXT DEBUG CARD */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={styles.sectionTitle}>📡 Your Context</Text>
          
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.contextGrid}>
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>📱</Text>
                <Text style={styles.contextLabel}>Device</Text>
                <Text style={styles.contextValue}>{signals?.device.brand} {signals?.device.modelName?.slice(0, 10)}</Text>
              </View>
              
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>📶</Text>
                <Text style={styles.contextLabel}>Network</Text>
                <Text style={styles.contextValue}>{signals?.network.type}</Text>
              </View>
              
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>🔋</Text>
                <Text style={styles.contextLabel}>Battery</Text>
                <Text style={styles.contextValue}>
                  {Math.round((signals?.battery.level || 0) * 100)}%
                  {signals?.battery.isCharging ? ' ⚡' : ''}
                </Text>
              </View>
              
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>⏰</Text>
                <Text style={styles.contextLabel}>Time</Text>
                <Text style={styles.contextValue}>{signals?.context.timeOfDay}</Text>
              </View>
              
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>🌐</Text>
                <Text style={styles.contextLabel}>Language</Text>
                <Text style={styles.contextValue}>{signals?.context.language.toUpperCase()}</Text>
              </View>
              
              <View style={styles.contextItem}>
                <Text style={styles.contextEmoji}>📅</Text>
                <Text style={styles.contextLabel}>Day</Text>
                <Text style={styles.contextValue}>{signals?.context.isWeekend ? 'Weekend' : 'Weekday'}</Text>
              </View>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DAY SIMULATOR */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={styles.sectionTitle}>🎮 Journey Day Simulator</Text>
          
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={styles.simulatorHint}>
              Tap to see how the experience changes over the user journey
            </Text>
            <View style={styles.dayButtons}>
              {[0, 5, 15, 30].map((day) => (
                <TouchableOpacity 
                  key={day}
                  style={[
                    styles.dayButton,
                    journeyDay === day && { backgroundColor: theme.accent }
                  ]}
                  onPress={() => {
                    setJourneyDay(day);
                    runEngine(day);
                  }}
                >
                  <Text style={[
                    styles.dayButtonText,
                    journeyDay === day && { color: '#FFF' }
                  ]}>
                    Day {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* WHY THIS EXPERIENCE - Transparent Reasoning */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={styles.sectionTitle}>🔍 Why This Experience?</Text>
          
          <View style={[styles.reasoningCard, { backgroundColor: theme.card }]}>
            <Text style={styles.reasoningIntro}>
              Here's what signals we used to personalize your experience:
            </Text>
            {inference?.reasoning?.map((reason: string, index: number) => (
              <View key={index} style={styles.reasoningItem}>
                <Text style={styles.reasoningText}>{reason}</Text>
              </View>
            ))}
            <View style={styles.transparencyBadge}>
              <Text style={styles.transparencyText}>
                🛡️ Your data stays on your device. We only read signals when the app is open.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerEmoji}>🇮🇳</Text>
            <Text style={styles.footerText}>Bharat Context-Adaptive Engine</Text>
            <Text style={styles.footerSubtext}>Built for the Next Billion Users</Text>
          </View>
          
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  
  // Header
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  personaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  personaEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  personaDescription: {
    fontSize: 14,
    color: '#666',
  },
  modeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  modeBadgeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Cards
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Journey
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  journeyDay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#138808',
    fontWeight: '700',
  },
  valueDelivered: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  valueIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  insightText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Suggestions
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    color: '#666',
  },
  suggestionArrow: {
    fontSize: 20,
    color: '#CCC',
    marginLeft: 8,
  },
  
  // Context Grid
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  contextItem: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  contextEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  contextValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  
  // Day Simulator
  simulatorHint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  dayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  
  // Reasoning Section
  reasoningCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  reasoningIntro: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  reasoningItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reasoningText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  transparencyBadge: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  transparencyText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  footerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
