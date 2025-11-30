import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Linking,
  Alert
} from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { 
  initBharatEngine, 
  requestPermissions, 
  trackEvent,
  sendFeedback,
  createFingerprint,
  getFingerprintId 
} from '@bharat-engine/sdk';
import type { BharatSignals, EngineResponse, Suggestion, IntelligenceSummary } from '@bharat-engine/sdk';
import Questionnaire from './components/Questionnaire';
import * as SecureStore from 'expo-secure-store';

// Feedback storage key
const FEEDBACK_STORAGE_KEY = 'bharat_engine_feedback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Feedback types
type FeedbackType = 'like' | 'dislike' | null;
interface FeedbackState {
  [key: string]: FeedbackType; // key = `${scenario}_${action}`
}

// ═══════════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  saffron: '#FF9933',
  white: '#FFFFFF',
  green: '#138808',
  navy: '#000080',
  lite: { bg: '#FAFAFA', card: '#FFFFFF', text: '#1A1A1A', accent: '#FF9933' },
  standard: { bg: '#F0F4F8', card: '#FFFFFF', text: '#1A1A1A', accent: '#138808' },
  rich: { bg: '#1A1A2E', card: '#16213E', text: '#FFFFFF', accent: '#E94560' }
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [signals, setSignals] = useState<BharatSignals | null>(null);
  const [inference, setInference] = useState<EngineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [journeyDay, setJourneyDay] = useState(0); // Start with Day 0 for questionnaire
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({}); // Like/dislike state
  const [fingerprintReady, setFingerprintReady] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sessionStartTime = useRef<number>(Date.now());

  // Initialize fingerprint and load feedback on mount
  useEffect(() => {
    const init = async () => {
      // Create fingerprint for user intelligence tracking
      console.log("🔐 Initializing fingerprint...");
      await createFingerprint();
      setFingerprintReady(true);
      
      // Load saved feedback
      loadFeedback();
      
      // Track session start
      sessionStartTime.current = Date.now();
    };
    
    init();
    
    // Track session end when app closes (approximate)
    return () => {
      const duration = Date.now() - sessionStartTime.current;
      trackEvent({
        eventType: 'session_end',
        eventName: 'app_closed',
        durationMs: duration
      }).catch(console.error);
    };
  }, []);

  const loadFeedback = async () => {
    try {
      const saved = await SecureStore.getItemAsync(FEEDBACK_STORAGE_KEY);
      if (saved) {
        setFeedback(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Could not load feedback:', e);
    }
  };

  const saveFeedback = async (newFeedback: FeedbackState) => {
    try {
      await SecureStore.setItemAsync(FEEDBACK_STORAGE_KEY, JSON.stringify(newFeedback));
    } catch (e) {
      console.log('Could not save feedback:', e);
    }
  };

  // Handle like/dislike on a suggestion - NOW WITH LEARNING! 🧠
  const handleFeedback = async (suggestion: Suggestion, type: FeedbackType) => {
    const key = `${inference?.matched_scenario}_${suggestion.action}`;
    const currentFeedback = feedback[key];
    
    // Toggle: if same feedback clicked again, remove it
    const newFeedbackType = currentFeedback === type ? null : type;
    
    const newFeedback = { ...feedback, [key]: newFeedbackType };
    setFeedback(newFeedback);
    saveFeedback(newFeedback);
    
    // Send feedback to backend for learning!
    if (newFeedbackType && inference?.matched_scenario) {
      try {
        // Determine category from the suggestion
        const content = suggestion.specificContent;
        const category = content?.type === 'video' ? 'entertainment' :
                        content?.type === 'song' ? 'music' :
                        content?.type === 'recipe' ? 'cooking' :
                        content?.type === 'podcast' ? 'education' :
                        content?.type === 'article' ? 'reading' : 'general';
        
        const result = await sendFeedback(
          suggestion.action,
          inference.matched_scenario,
          newFeedbackType,
          {
            category,
            contentType: content?.type,
            source: content?.source
          }
        );
        
        if (result.learningApplied) {
          console.log(`🧠 Learning applied! Your preferences updated.`);
        }
      } catch (e) {
        console.log('Feedback send failed (will retry):', e);
      }
    }
    
    console.log(`📊 Feedback: ${suggestion.title} - ${newFeedbackType || 'neutral'}`);
  };

  // Handle deep link when suggestion is tapped - NOW TRACKS EVENTS! 📊
  const handleSuggestionPress = async (suggestion: Suggestion) => {
    const content = suggestion.specificContent;
    
    // Track this click event for learning!
    try {
      await trackEvent({
        eventType: 'click',
        eventName: `clicked_${suggestion.action}`,
        category: content?.type === 'video' ? 'entertainment' :
                 content?.type === 'song' ? 'music' :
                 content?.type === 'recipe' ? 'cooking' :
                 content?.type === 'podcast' ? 'education' :
                 content?.type === 'article' ? 'reading' : 'general',
        contentType: content?.type,
        source: content?.source,
        scenario: inference?.matched_scenario
      });
    } catch (e) {
      console.log('Event tracking failed:', e);
    }
    
    if (content?.deepLink) {
      try {
        const canOpen = await Linking.canOpenURL(content.deepLink);
        if (canOpen) {
          console.log(`🔗 Opening: ${content.deepLink}`);
          await Linking.openURL(content.deepLink);
          
          // Track view event when deep link opens
          trackEvent({
            eventType: 'view',
            eventName: `viewed_${suggestion.action}`,
            category: content?.type === 'video' ? 'entertainment' :
                     content?.type === 'song' ? 'music' : 'general',
            contentType: content?.type,
            source: content?.source,
            scenario: inference?.matched_scenario
          }).catch(console.error);
          
        } else if (content.fallbackUrl) {
          console.log(`🌐 Fallback: ${content.fallbackUrl}`);
          await Linking.openURL(content.fallbackUrl);
        } else {
          Alert.alert(
            `Open ${content.source}`,
            `${content.name} is available on ${content.source}. Install the app to open directly!`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error opening link:', error);
        if (content.fallbackUrl) {
          await Linking.openURL(content.fallbackUrl);
        }
      }
    } else {
      // No deep link - just log the action
      console.log(`🎯 Action: ${suggestion.action}`);
      Alert.alert(suggestion.title, suggestion.description);
    }
  };

  const runEngine = async (day: number = journeyDay) => {
    setLoading(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    
    try {
      // Request permissions on first run
      if (!permissionsRequested) {
        console.log("📋 Requesting permissions...");
        await requestPermissions();
        setPermissionsRequested(true);
      }
      
      // Ensure fingerprint is ready
      if (!fingerprintReady) {
        console.log("🔐 Waiting for fingerprint...");
        await createFingerprint();
        setFingerprintReady(true);
      }

      console.log(`🚀 Running engine for Day ${day}...`);
      const data = await initBharatEngine(day);
      setSignals(data.signals);
      setInference(data.inference);
      
      // Update journey day from inference if available
      if (data.inference.journey?.day > day) {
        setJourneyDay(data.inference.journey.day);
      }
      
      // Log intelligence info
      const summary = (data.inference as any).intelligenceSummary;
      if (summary) {
        console.log(`🧠 Intelligence: Day ${summary.journeyDay}, Stage: ${summary.stage}`);
        console.log(`💡 Insights: ${summary.insights?.join(', ')}`);
        console.log(`📊 Engagement: ${(summary.engagementScore * 100).toFixed(0)}%`);
      }
      
      // Show questionnaire for new users who haven't completed Day 0
      if (day === 0 && !data.signals.questionnaire.completedDays?.includes(0)) {
        setShowQuestionnaire(true);
      }
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
      
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEngine();
  }, []);

  const mode = inference?.recommended_mode || 'standard';
  const theme = COLORS[mode as keyof typeof COLORS] || COLORS.standard;

  // Loading Screen
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#138808' }]}>
        <Text style={styles.loadingEmoji}>🙏</Text>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Consulting Munim Ji...</Text>
        <Text style={styles.loadingSubtext}>Collecting {permissionsRequested ? 'all' : 'initial'} signals</Text>
      </View>
    );
  }

  // Questionnaire Modal
  if (showQuestionnaire && signals) {
    return (
      <Questionnaire
        journeyDay={journeyDay}
        existingAnswers={signals.questionnaire || {}}
        onComplete={(answers) => {
          setShowQuestionnaire(false);
          runEngine(journeyDay); // Re-run with new answers
        }}
        onSkip={() => setShowQuestionnaire(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar style={mode === 'rich' ? 'light' : 'dark'} />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HEADER */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.header}>
            <Text style={[styles.greeting, mode === 'rich' && { color: '#FFF' }]}>
              {inference?.greeting}
            </Text>
            
            {/* Persona Card */}
            <View style={[styles.personaContainer, { backgroundColor: theme.card }]}>
              <Text style={styles.personaEmoji}>{inference?.persona.emoji}</Text>
              <View style={styles.personaInfo}>
                <Text style={[styles.personaName, mode === 'rich' && { color: '#FFF' }]}>
                  {inference?.persona.name}
                </Text>
                <Text style={styles.personaDescription}>{inference?.persona.description}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {Math.round((inference?.confidence || 0) * 100)}% match
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Mode Badge */}
            <View style={[styles.modeBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.modeBadgeText}>
                {mode === 'lite' ? '⚡ Lite' : mode === 'rich' ? '✨ Rich' : '🎯 Standard'} Mode
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* JOURNEY PROGRESS - With Intelligence! 🧠 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.journeyHeader}>
              <Text style={[styles.journeyTitle, mode === 'rich' && { color: '#FFF' }]}>
                🚀 Your Journey
              </Text>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>Day {inference?.journey.day}</Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View 
                  style={[styles.progressFill, { 
                    width: `${Math.min((inference?.journey.day || 0) / 30 * 100, 100)}%`,
                    backgroundColor: theme.accent 
                  }]}
                />
              </View>
              <View style={styles.progressLabels}>
                {['Newcomer', 'Explorer', 'Regular', 'Partner'].map((label, i) => (
                  <Text key={label} style={[
                    styles.progressLabel,
                    inference?.journey.stage === label.toLowerCase() && styles.activeLabel
                  ]}>{label}</Text>
                ))}
              </View>
            </View>
            
            {/* Intelligence Summary */}
            {(inference as any)?.intelligenceSummary && (
              <View style={[styles.intelligenceCard, { backgroundColor: `${theme.accent}10` }]}>
                <View style={styles.intelligenceHeader}>
                  <Text style={styles.intelligenceEmoji}>🧠</Text>
                  <Text style={[styles.intelligenceTitle, mode === 'rich' && { color: '#FFF' }]}>
                    We're Learning!
                  </Text>
                </View>
                <View style={styles.engagementBar}>
                  <View style={styles.engagementTrack}>
                    <View style={[styles.engagementFill, {
                      width: `${((inference as any).intelligenceSummary?.engagementScore || 0) * 100}%`,
                      backgroundColor: theme.accent
                    }]} />
                  </View>
                  <Text style={styles.engagementLabel}>
                    {((inference as any).intelligenceSummary?.personalizationLevel || 'low').toUpperCase()} personalization
                  </Text>
                </View>
                {(inference as any).intelligenceSummary?.topCategories?.length > 0 && (
                  <Text style={styles.topCategoriesText}>
                    ❤️ You love: {(inference as any).intelligenceSummary.topCategories.join(', ')}
                  </Text>
                )}
              </View>
            )}
            
            <View style={[styles.valueDelivered, { backgroundColor: `${theme.accent}15` }]}>
              <Text style={styles.valueIcon}>💎</Text>
              <Text style={[styles.valueText, { color: theme.accent }]}>
                {inference?.journey.value_delivered}
              </Text>
            </View>
            
            <Text style={styles.nextMilestone}>{inference?.journey.nextMilestone}</Text>
            
            {/* Dynamic Recommendations Badge */}
            {(inference as any)?.dynamicRecommendations && (
              <View style={[styles.dynamicBadge, { borderColor: theme.accent }]}>
                <Text style={[styles.dynamicBadgeText, { color: theme.accent }]}>
                  ✨ Dynamic Recommendations Active
                </Text>
              </View>
            )}
            
            <View style={styles.insightsContainer}>
              {inference?.journey.insights.map((insight, index) => (
                <View key={index} style={styles.insightBadge}>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SUGGESTIONS */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionTitle, mode === 'rich' && { color: '#FFF' }]}>
            ✨ For You Right Now
          </Text>
          
          {inference?.suggestions.map((suggestion: Suggestion, index: number) => {
            const feedbackKey = `${inference?.matched_scenario}_${suggestion.action}`;
            const currentFeedback = feedback[feedbackKey];
            const hasDeepLink = !!suggestion.specificContent?.deepLink;
            
            return (
              <View key={index} style={[styles.suggestionCard, { backgroundColor: theme.card }]}>
                {/* Main tappable content */}
                <TouchableOpacity 
                  style={styles.suggestionMain}
                  activeOpacity={0.7}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                  <View style={styles.suggestionContent}>
                    <Text style={[styles.suggestionTitle, mode === 'rich' && { color: '#FFF' }]}>
                      {suggestion.title}
                    </Text>
                    <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                    {/* Show source badge if has specific content */}
                    {suggestion.specificContent && (
                      <View style={[styles.sourceBadge, { backgroundColor: `${theme.accent}20` }]}>
                        <Text style={[styles.sourceText, { color: theme.accent }]}>
                          {hasDeepLink ? '🔗' : '📌'} {suggestion.specificContent.source}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.suggestionArrow}>→</Text>
                </TouchableOpacity>
                
                {/* Like/Dislike buttons */}
                <View style={styles.feedbackContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.feedbackButton,
                      currentFeedback === 'like' && styles.feedbackButtonActive,
                      currentFeedback === 'like' && { backgroundColor: '#E8F5E9' }
                    ]}
                    onPress={() => handleFeedback(suggestion, 'like')}
                  >
                    <Text style={[
                      styles.feedbackEmoji,
                      currentFeedback === 'like' && styles.feedbackEmojiActive
                    ]}>
                      👍
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.feedbackButton,
                      currentFeedback === 'dislike' && styles.feedbackButtonActive,
                      currentFeedback === 'dislike' && { backgroundColor: '#FFEBEE' }
                    ]}
                    onPress={() => handleFeedback(suggestion, 'dislike')}
                  >
                    <Text style={[
                      styles.feedbackEmoji,
                      currentFeedback === 'dislike' && styles.feedbackEmojiActive
                    ]}>
                      👎
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ALL SIGNALS (Expanded View) */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionTitle, mode === 'rich' && { color: '#FFF' }]}>
            📡 Collected Signals
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {/* Device */}
            <View style={styles.signalSection}>
              <Text style={[styles.signalSectionTitle, mode === 'rich' && { color: '#FFF' }]}>
                📱 Device
              </Text>
              <Text style={styles.signalItem}>
                {signals?.device.brand} {signals?.device.modelName}
              </Text>
              <Text style={styles.signalItem}>
                RAM: {signals?.device.totalMemory ? Math.round(signals.device.totalMemory / 1024 / 1024 / 1024) + 'GB' : 'Unknown'}
                {signals?.device.isLowEnd ? ' (Budget)' : ' (High-end)'}
              </Text>
              <Text style={styles.signalItem}>
                Font Scale: {signals?.device.fontScale?.toFixed(1)}x | 
                Theme: {signals?.device.colorScheme}
              </Text>
            </View>

            {/* Network */}
            <View style={styles.signalSection}>
              <Text style={[styles.signalSectionTitle, mode === 'rich' && { color: '#FFF' }]}>
                📶 Network
              </Text>
              <Text style={styles.signalItem}>
                {signals?.network.type} {signals?.network.isWifi ? '(WiFi)' : ''}
              </Text>
              {signals?.network.carrierName && (
                <Text style={styles.signalItem}>Carrier: {signals.network.carrierName}</Text>
              )}
            </View>

            {/* Battery & Environment */}
            <View style={styles.signalSection}>
              <Text style={[styles.signalSectionTitle, mode === 'rich' && { color: '#FFF' }]}>
                🔋 Battery & Environment
              </Text>
              <Text style={styles.signalItem}>
                Battery: {Math.round((signals?.battery.level || 0) * 100)}%
                {signals?.battery.isCharging ? ' ⚡' : ''}
                {signals?.battery.isLowPower ? ' (Low)' : ''}
              </Text>
              <Text style={styles.signalItem}>
                Brightness: {Math.round((signals?.environment.brightness || 0) * 100)}%
              </Text>
            </View>

            {/* Location */}
            <View style={styles.signalSection}>
              <Text style={[styles.signalSectionTitle, mode === 'rich' && { color: '#FFF' }]}>
                📍 Location
              </Text>
              {signals?.location.hasPermission ? (
                <>
                  <Text style={styles.signalItem}>
                    {signals.location.city || 'Unknown'}, {signals.location.state || ''}
                  </Text>
                  <Text style={styles.signalItem}>
                    Tier: {signals.location.tier} | {signals.location.isUrban ? 'Urban' : 'Rural'}
                  </Text>
                </>
              ) : (
                <Text style={styles.signalItemMuted}>Permission not granted</Text>
              )}
            </View>

            {/* App */}
            <View style={styles.signalSection}>
              <Text style={[styles.signalSectionTitle, mode === 'rich' && { color: '#FFF' }]}>
                📲 App Usage
              </Text>
              <Text style={styles.signalItem}>
                Session #{signals?.app.sessionCount} | 
                {signals?.app.isFirstLaunch ? ' First Launch!' : ''}
              </Text>
              <Text style={styles.signalItem}>
                Storage: {signals?.app.storageAvailable 
                  ? (signals.app.storageAvailable / 1024 / 1024 / 1024).toFixed(1) + 'GB free' 
                  : 'Unknown'}
              </Text>
            </View>

            {/* Context */}
            <View style={styles.signalSection}>
              <Text style={[styles.signalSectionTitle, mode === 'rich' && { color: '#FFF' }]}>
                ⏰ Context
              </Text>
              <Text style={styles.signalItem}>
                {signals?.context.timeOfDay.charAt(0).toUpperCase() + signals?.context.timeOfDay?.slice(1)} | 
                {signals?.context.isWeekend ? ' Weekend' : ' Weekday'}
              </Text>
              <Text style={styles.signalItem}>
                Language: {signals?.context.language?.toUpperCase()} | 
                {signals?.context.timezone}
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* REASONING */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionTitle, mode === 'rich' && { color: '#FFF' }]}>
            🔍 Why This Experience?
          </Text>
          
          <View style={[styles.reasoningCard, { backgroundColor: theme.card }]}>
            {inference?.reasoning?.map((reason: string, index: number) => (
              <View key={index} style={styles.reasoningItem}>
                <Text style={[styles.reasoningText, mode === 'rich' && { color: '#CCC' }]}>
                  {reason}
                </Text>
              </View>
            ))}
            <View style={styles.transparencyBadge}>
              <Text style={styles.transparencyText}>
                🛡️ All data stays on your device. Privacy first.
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DAY SIMULATOR */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionTitle, mode === 'rich' && { color: '#FFF' }]}>
            🎮 Journey Simulator
          </Text>
          
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.simulatorHint, mode === 'rich' && { color: '#AAA' }]}>
              Tap to simulate different journey days
            </Text>
            <View style={styles.dayButtons}>
              {[0, 5, 15, 30].map((day) => (
                <TouchableOpacity 
                  key={day}
                  style={[styles.dayButton, journeyDay === day && { backgroundColor: theme.accent }]}
                  onPress={() => { setJourneyDay(day); runEngine(day); }}
                >
                  <Text style={[styles.dayButtonText, journeyDay === day && { color: '#FFF' }]}>
                    Day {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Questionnaire Button */}
            <TouchableOpacity 
              style={[styles.questionnaireButton, { borderColor: theme.accent }]}
              onPress={() => setShowQuestionnaire(true)}
            >
              <Text style={[styles.questionnaireButtonText, { color: theme.accent }]}>
                📝 Update Your Preferences
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerEmoji}>🇮🇳</Text>
            <Text style={[styles.footerText, mode === 'rich' && { color: '#FFF' }]}>
              Bharat Context-Adaptive Engine v0.4
            </Text>
            <Text style={[styles.footerSubtext, mode === 'rich' && { color: '#888' }]}>
              User Intelligence • Dynamic Recommendations • Day 0→30 Journey
            </Text>
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { padding: 20, paddingTop: 60 },
  
  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingEmoji: { fontSize: 60, marginBottom: 20 },
  loadingText: { color: '#FFF', fontSize: 18, fontWeight: '600', marginTop: 20 },
  loadingSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 },
  
  // Header
  header: { marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  personaContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, elevation: 2 },
  personaEmoji: { fontSize: 48, marginRight: 16 },
  personaInfo: { flex: 1 },
  personaName: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  personaDescription: { fontSize: 14, color: '#666', marginBottom: 8 },
  confidenceBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  confidenceText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  modeBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16 },
  modeBadgeText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  // Cards
  card: { borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  
  // Journey
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  journeyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  journeyDay: { fontSize: 16, fontWeight: '600', color: '#666' },
  dayBadge: { backgroundColor: '#138808', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  dayBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  progressContainer: { marginBottom: 16 },
  progressTrack: { height: 8, backgroundColor: '#E8E8E8', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 10, color: '#999', fontWeight: '500' },
  activeLabel: { color: '#138808', fontWeight: '700' },
  valueDelivered: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8 },
  valueIcon: { fontSize: 20, marginRight: 8 },
  valueText: { fontSize: 16, fontWeight: '600' },
  nextMilestone: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  insightsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  insightBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  insightText: { fontSize: 12, color: '#666' },
  
  // Intelligence Card
  intelligenceCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  intelligenceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  intelligenceEmoji: { fontSize: 20, marginRight: 8 },
  intelligenceTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  engagementBar: { marginBottom: 8 },
  engagementTrack: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  engagementFill: { height: '100%', borderRadius: 3 },
  engagementLabel: { fontSize: 10, color: '#666', textAlign: 'right' },
  topCategoriesText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  dynamicBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center', marginBottom: 12 },
  dynamicBadgeText: { fontSize: 12, fontWeight: '600' },
  
  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 12, marginTop: 8 },
  
  // Suggestions
  suggestionCard: { borderRadius: 16, marginBottom: 12, elevation: 2, overflow: 'hidden' },
  suggestionMain: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  suggestionIcon: { fontSize: 32, marginRight: 16 },
  suggestionContent: { flex: 1 },
  suggestionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  suggestionDescription: { fontSize: 13, color: '#666', marginBottom: 6 },
  suggestionArrow: { fontSize: 20, color: '#CCC', marginLeft: 8 },
  
  // Source badge (for deep links)
  sourceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sourceText: { fontSize: 11, fontWeight: '600' },
  
  // Feedback buttons (like/dislike)
  feedbackContainer: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    gap: 12
  },
  feedbackButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  feedbackButtonActive: { 
    transform: [{ scale: 1.1 }]
  },
  feedbackEmoji: { 
    fontSize: 18,
    opacity: 0.5
  },
  feedbackEmojiActive: { 
    opacity: 1,
    fontSize: 20
  },
  
  // Signals
  signalSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  signalSectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  signalItem: { fontSize: 13, color: '#666', marginBottom: 4 },
  signalItemMuted: { fontSize: 13, color: '#999', fontStyle: 'italic' },
  
  // Reasoning
  reasoningCard: { borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E8E8E8', borderStyle: 'dashed' },
  reasoningItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  reasoningText: { fontSize: 14, color: '#333', lineHeight: 20 },
  transparencyBadge: { marginTop: 16, padding: 12, backgroundColor: '#E8F5E9', borderRadius: 8 },
  transparencyText: { fontSize: 12, color: '#2E7D32', textAlign: 'center' },
  
  // Simulator
  simulatorHint: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 16 },
  dayButtons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  dayButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: '#F0F0F0' },
  dayButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },
  questionnaireButton: { borderWidth: 2, borderRadius: 16, padding: 16, alignItems: 'center' },
  questionnaireButtonText: { fontSize: 14, fontWeight: '600' },
  
  // Footer
  footer: { alignItems: 'center', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E8E8E8' },
  footerEmoji: { fontSize: 32, marginBottom: 8 },
  footerText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  footerSubtext: { fontSize: 12, color: '#999', marginTop: 4 },
});
