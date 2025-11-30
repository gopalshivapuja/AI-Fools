import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { saveQuestionnaire } from '@bharat-engine/sdk';
import type { QuestionnaireAnswers } from '@bharat-engine/sdk';

// ═══════════════════════════════════════════════════════════════
// QUESTION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface QuestionOption {
  id: string;
  label: string;
  emoji: string;
}

interface Question {
  id: keyof QuestionnaireAnswers;
  title: string;
  subtitle: string;
  options: QuestionOption[];
  multiSelect?: boolean;
  day: number; // Which journey day this question appears
}

const QUESTIONS: Question[] = [
  // Day 0 Questions
  {
    id: 'primaryUse',
    title: 'What brings you here? 🎯',
    subtitle: 'Help us personalize your experience',
    day: 0,
    options: [
      { id: 'business', label: 'Business', emoji: '💼' },
      { id: 'personal', label: 'Personal', emoji: '🏠' },
      { id: 'education', label: 'Education', emoji: '📚' },
      { id: 'spiritual', label: 'Spiritual', emoji: '🙏' },
    ],
  },
  {
    id: 'preferredLanguage',
    title: 'Preferred Language? 🌐',
    subtitle: 'We\'ll show content in your language',
    day: 0,
    options: [
      { id: 'en', label: 'English', emoji: '🇬🇧' },
      { id: 'hi', label: 'हिंदी', emoji: '🇮🇳' },
      { id: 'ta', label: 'தமிழ்', emoji: '🏛️' },
      { id: 'te', label: 'తెలుగు', emoji: '🌾' },
      { id: 'mr', label: 'मराठी', emoji: '🏔️' },
      { id: 'bn', label: 'বাংলা', emoji: '🎭' },
    ],
  },
  {
    id: 'ageGroup',
    title: 'Your Age Group? 📅',
    subtitle: 'Helps us show relevant content',
    day: 0,
    options: [
      { id: '18-25', label: '18-25', emoji: '🎓' },
      { id: '26-35', label: '26-35', emoji: '💪' },
      { id: '36-50', label: '36-50', emoji: '🏆' },
      { id: '50+', label: '50+', emoji: '🌟' },
    ],
  },
  // Day 3 Questions
  {
    id: 'interests',
    title: 'What interests you? ✨',
    subtitle: 'Select all that apply',
    day: 3,
    multiSelect: true,
    options: [
      { id: 'news', label: 'News', emoji: '📰' },
      { id: 'shopping', label: 'Shopping', emoji: '🛒' },
      { id: 'finance', label: 'Finance', emoji: '💰' },
      { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
      { id: 'health', label: 'Health', emoji: '💊' },
      { id: 'devotional', label: 'Devotional', emoji: '🕉️' },
    ],
  },
  {
    id: 'occupation',
    title: 'What do you do? 💼',
    subtitle: 'Help us understand your daily routine',
    day: 3,
    options: [
      { id: 'student', label: 'Student', emoji: '📚' },
      { id: 'employee', label: 'Employee', emoji: '👔' },
      { id: 'business_owner', label: 'Business Owner', emoji: '🏪' },
      { id: 'homemaker', label: 'Homemaker', emoji: '🏠' },
      { id: 'retired', label: 'Retired', emoji: '🌴' },
    ],
  },
  // Day 7 Questions
  {
    id: 'shoppingFrequency',
    title: 'How often do you shop online? 🛍️',
    subtitle: 'We\'ll adjust recommendations accordingly',
    day: 7,
    options: [
      { id: 'daily', label: 'Daily', emoji: '📦' },
      { id: 'weekly', label: 'Weekly', emoji: '📅' },
      { id: 'monthly', label: 'Monthly', emoji: '🗓️' },
      { id: 'rarely', label: 'Rarely', emoji: '🤷' },
    ],
  },
  {
    id: 'contentPreference',
    title: 'How do you prefer content? 📱',
    subtitle: 'We\'ll optimize for your style',
    day: 7,
    options: [
      { id: 'text', label: 'Text', emoji: '📝' },
      { id: 'images', label: 'Images', emoji: '🖼️' },
      { id: 'video', label: 'Video', emoji: '🎥' },
      { id: 'audio', label: 'Audio', emoji: '🎧' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// QUESTIONNAIRE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface QuestionnaireProps {
  journeyDay: number;
  existingAnswers: Partial<QuestionnaireAnswers>;
  onComplete: (answers: Partial<QuestionnaireAnswers>) => void;
  onSkip: () => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({
  journeyDay,
  existingAnswers,
  onComplete,
  onSkip,
}) => {
  // Filter questions for current day that haven't been answered
  const relevantQuestions = QUESTIONS.filter(q => {
    const dayMatch = q.day <= journeyDay;
    const notAnswered = !existingAnswers.completedDays?.includes(q.day);
    return dayMatch && notAnswered;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(1));

  if (relevantQuestions.length === 0) {
    return null; // No questions to show
  }

  const currentQuestion = relevantQuestions[currentIndex];
  const progress = (currentIndex + 1) / relevantQuestions.length;

  const handleOptionSelect = (optionId: string) => {
    if (currentQuestion.multiSelect) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single select - save and move on
      const newAnswers = {
        ...answers,
        [currentQuestion.id]: optionId,
      };
      setAnswers(newAnswers);
      
      // Animate and go to next
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        if (currentIndex < relevantQuestions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelectedOptions([]);
        } else {
          finishQuestionnaire(newAnswers);
        }
      }, 200);
    }
  };

  const handleMultiSelectContinue = () => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selectedOptions,
    };
    setAnswers(newAnswers);

    if (currentIndex < relevantQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptions([]);
    } else {
      finishQuestionnaire(newAnswers);
    }
  };

  const finishQuestionnaire = async (finalAnswers: Partial<QuestionnaireAnswers>) => {
    // Mark which days we've completed
    const completedDays = [...(existingAnswers.completedDays || [])];
    relevantQuestions.forEach(q => {
      if (!completedDays.includes(q.day)) {
        completedDays.push(q.day);
      }
    });

    const fullAnswers = {
      ...finalAnswers,
      completedDays,
      answeredAt: Date.now(),
    };

    // Save to local storage
    await saveQuestionnaire(fullAnswers);
    
    // Notify parent
    onComplete(fullAnswers);
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {relevantQuestions.length}
        </Text>
      </View>

      {/* Question Card */}
      <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
        <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
        <Text style={styles.questionSubtitle}>{currentQuestion.subtitle}</Text>

        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          {currentQuestion.options.map(option => {
            const isSelected = currentQuestion.multiSelect
              ? selectedOptions.includes(option.id)
              : answers[currentQuestion.id] === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                onPress={() => handleOptionSelect(option.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Multi-select continue button */}
        {currentQuestion.multiSelect && selectedOptions.length > 0 && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleMultiSelectContinue}
          >
            <Text style={styles.continueButtonText}>
              Continue ({selectedOptions.length} selected)
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#138808',
    padding: 20,
    paddingTop: 60,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  questionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#138808',
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  optionLabelSelected: {
    color: '#138808',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#138808',
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#138808',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});

export default Questionnaire;



