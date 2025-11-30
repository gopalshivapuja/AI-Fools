plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.bharatengine.munimji"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.bharatengine.munimji"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.5"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.activity:activity-compose:1.8.1")

    // Compose BOM - Manages all Compose versions
    implementation(platform("androidx.compose:compose-bom:2023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.5")

    // Animations
    implementation("androidx.compose.animation:animation")

    // ═══════════════════════════════════════════════════════════════
    // NETWORKING - For Backend API Calls
    // ═══════════════════════════════════════════════════════════════
    
    // Retrofit - The HTTP client that makes API calls easy
    // Think of it as a "waiter" that takes your order (request) and brings back food (response)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    
    // Gson Converter - Converts JSON to Kotlin objects and vice versa
    // Like a translator between the backend's language (JSON) and Kotlin
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    
    // OkHttp - The underlying HTTP engine (Retrofit uses this)
    // Also provides logging so we can see what's happening
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // ═══════════════════════════════════════════════════════════════
    // VIEWMODEL & COROUTINES - For State Management
    // ═══════════════════════════════════════════════════════════════
    
    // ViewModel for Compose - Survives configuration changes (like screen rotation)
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.6.2")
    
    // Coroutines - For async operations (API calls without freezing the UI)
    // Think of it as a kitchen that can cook multiple dishes at once
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // ═══════════════════════════════════════════════════════════════
    // IMAGE LOADING - For Recommendation Card Images
    // ═══════════════════════════════════════════════════════════════
    
    // Coil - Modern image loading library for Compose
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Debug tools
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}

