# Munim Ji 🙏

> Your Digital Pulse - Personalized recommendations for Bharat

Munim Ji is a native Android app that delivers personalized greetings and recommendations following the ChatGPT Pulse design philosophy. It's part of the Bharat Context-Adaptive Engine ecosystem.

## Features

- **☀️ Time-Contextual Pulse** - Dynamic greetings based on time of day
- **👆 Swipeable Cards** - Tinder-style like/dislike gestures
- **🔗 Deep Links** - Tap to open content in native apps
- **🌙 Dark/Light Theme Toggle** - ChatGPT Pulse-style dark mode (default) or light mode
- **⚙️ Extensible Settings** - Preferences, theme toggle, and feedback options

## Design Philosophy

Following ChatGPT Pulse's design principles:
1. **Daily Digest Format** - Content as a morning/evening briefing
2. **Glanceable Cards** - Focused, scannable units
3. **Generous White Space** - Breathable, not cluttered
4. **Time-Contextual Headers** - Dynamic based on time of day
5. **Subtle Animations** - Smooth, purposeful motion
6. **Source Transparency** - Clear attribution (YouTube, Spotify, etc.)

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose (Material Design 3)
- **Navigation**: Compose Navigation
- **Min SDK**: 26 (Android 8.0)
- **Target SDK**: 34 (Android 14)

## Project Structure

```
munim-ji/
├── app/src/main/java/com/bharatengine/munimji/
│   ├── ui/
│   │   ├── theme/          # Colors, typography, theme
│   │   ├── screens/        # HomeScreen, SettingsScreen
│   │   └── components/     # Reusable UI components
│   ├── data/
│   │   └── MockData.kt     # Placeholder data (SDK integration later)
│   ├── navigation/
│   │   └── NavGraph.kt     # Screen navigation
│   └── MainActivity.kt     # Entry point
```

## Building the APK

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 17
- Android SDK 34

### Build Steps

1. Open the project in Android Studio:
   ```
   File → Open → Select munim-ji folder
   ```

2. Sync Gradle (automatic on open)

3. Build Debug APK:
   ```
   Build → Build Bundle(s) / APK(s) → Build APK(s)
   ```

4. APK location:
   ```
   munim-ji/app/build/outputs/apk/debug/app-debug.apk
   ```

### Command Line Build
```bash
cd munim-ji
./gradlew assembleDebug
```

## Future Integration

This is the UI/UX phase. Future phases will add:
- [ ] SDK integration for real recommendations
- [ ] Signal collectors (sensors, SIM, location)
- [ ] User preferences persistence
- [ ] Feedback to recommendation engine
- [ ] Push notifications

## Color Palette

### Dark Theme (Default - ChatGPT Pulse Style)
| Color | Hex | Usage |
|-------|-----|-------|
| Pulse Background | `#0D0D0D` | Main background |
| Pulse Surface | `#1A1A1A` | Card background |
| Pulse Saffron | `#FF9933` | Primary accent 🇮🇳 |
| Pulse Text | `#FFFFFF` | Primary text (white) |
| Swipe Like | `#34C759` | Like feedback |
| Swipe Dislike | `#FF3B30` | Dislike feedback |

### Light Theme (Toggle in Settings)
| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#FFFFFF` | Main background |
| Surface | `#FFFFFF` | Card background |
| Pulse Saffron | `#FF9933` | Primary accent 🇮🇳 |
| Pulse Text | `#1A1A1A` | Primary text (dark) |

## License

Part of the Bharat Context-Adaptive Engine project for App4Bharat Hackathon.

---

Made with ❤️ for Bharat 🇮🇳

