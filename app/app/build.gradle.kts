plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "dev.satooru.weardatacollector"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "dev.satooru.weardatacollector"
        minSdk = 24
        targetSdk = 37
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // 送信先は環境ごとに異なるため，-PaliveApiBaseUrl=... または gradle.properties で指定する
        val apiBaseUrl = providers.gradleProperty("aliveApiBaseUrl").getOrElse("")
        buildConfigField("String", "API_BASE_URL", "\"$apiBaseUrl\"")
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        release {
            optimization {
                enable = false
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.core.ktx)
    implementation(libs.material)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
}