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

        // 送信先は本番 API を既定とし，ローカル検証時などは -PaliveApiBaseUrl=... または gradle.properties で上書きする
        // 値は /api までのベース URL で，エンドポイントのパスは HeartRateApiClient が付与する
        val apiBaseUrl = providers.gradleProperty("aliveApiBaseUrl").getOrElse("https://alive.satooru.me/api")
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