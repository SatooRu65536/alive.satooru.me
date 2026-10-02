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
        // 送信 API の認証トークン．リポジトリに含めないよう，~/.gradle/gradle.properties または -PaliveApiToken=... で指定する
        val apiToken = providers.gradleProperty("aliveApiToken").getOrElse("")
        // API はこの形式以外のトークンを 400 で拒否し，アプリは 400 を再送不可としてデータを捨てるため，ビルド時に弾く．Java の文字列リテラルに埋め込める文字に限る意味もある
        if (apiToken.isNotEmpty() && !Regex("^[A-Za-z0-9._~+/-]+=*$").matches(apiToken)) {
            throw GradleException("aliveApiToken must match [A-Za-z0-9._~+/-]+=*")
        }
        buildConfigField("String", "API_TOKEN", "\"$apiToken\"")
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