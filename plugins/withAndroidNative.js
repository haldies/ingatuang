const { withAndroidManifest, withAppBuildGradle, withProjectBuildGradle, withMainApplication, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Main Plugin
 */
function withMyCustomNative(config) {
  // 0. Tambahkan mirror Maven agar build tetap jalan jika Maven Central diblokir
  config = withMavenMirror(config);

  // 1. Tambahkan dependensi Room ke build.gradle
  config = withRoomDependencies(config);

  // 2. Tambahkan Activity, Receiver, dan XML Widget ke AndroidManifest
  config = withCustomManifest(config);

  // 3. Daftarkan dan Sinkronisasi Paket Java di MainApplication.kt
  config = withCustomPackages(config);

  // 4. Salin file fisik (Java/XML/Drawables) dari folder plugins ke folder android hasil generate
  config = withCopyNativeFiles(config);

  return config;
}

/**
 * Step 0: root build.gradle repositories
 */
function withMavenMirror(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const mirror = "maven { url 'https://maven.aliyun.com/repository/public' }";

      if (!config.modResults.contents.includes(mirror)) {
        config.modResults.contents = config.modResults.contents.replace(
          /google\(\)\n/g,
          `google()\n    ${mirror}\n`
        );
      }
    }
    return config;
  });
}

/**
 * Step 1: build.gradle
 */
function withRoomDependencies(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const roomDeps = `
    // Added via Config Plugin (Best Practice)
    def room_version = "2.6.1"
    implementation "androidx.room:room-runtime:$room_version"
    annotationProcessor "androidx.room:room-compiler:$room_version"
    implementation "androidx.room:room-ktx:$room_version"
`;
      if (!config.modResults.contents.includes('androidx.room')) {
        config.modResults.contents = config.modResults.contents.replace(
          /dependencies {/,
          `dependencies {${roomDeps}`
        );
      }
    }
    return config;
  });
}

/**
 * Step 2: AndroidManifest.xml
 */
function withCustomManifest(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Cek apakah Activity sudah ada
    const hasQuickAddActivity = mainApplication.activity.some(
      (a) => a.$['android:name'] === '.QuickAddActivity'
    );

    if (!hasQuickAddActivity) {
      mainApplication.activity.push({
        $: {
          'android:name': '.QuickAddActivity',
          'android:theme': '@android:style/Theme.Material.Light.Dialog.NoActionBar',
          'android:exported': 'false',
        },
      });
    }

    // Cek apakah Receiver sudah ada
    const hasWidgetReceiver = mainApplication.receiver?.some(
      (r) => r.$['android:name'] === '.QuickAddWidgetProvider'
    );

    if (!hasWidgetReceiver) {
      if (!mainApplication.receiver) mainApplication.receiver = [];
      mainApplication.receiver.push({
        $: {
          'android:name': '.QuickAddWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/widget_quick_add_info',
            },
          },
        ],
      });
    }

    return config;
  });
}

/**
 * Step 3: MainApplication.kt registration
 */
function withCustomPackages(config) {
  return withMainApplication(config, (config) => {
    if (config.modResults.language === 'kt') {
      let content = config.modResults.contents;

      // Tambahkan Paket jika belum ada
      if (!content.includes('add(WidgetPackage())')) {
        content = content.replace(
          /PackageList\(this\)\.packages\.apply \{/,
          `PackageList(this).packages.apply {
              add(WidgetPackage())
              add(RoomStoragePackage())`
        );
      }
      config.modResults.contents = content;
    }
    return config;
  });
}

/**
 * Step 4: Copy Files (The most dangerous part)
 */
function withCopyNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const srcBase = path.join(projectRoot, 'plugins/android-native');
      const androidBase = path.join(projectRoot, 'android/app/src/main');

      const mappings = [
        { src: 'java/com/ingatuang/money', dest: 'java/com/ingatuang/money' },
        { src: 'res/xml', dest: 'res/xml' },
        { src: 'res/layout', dest: 'res/layout' },
        { src: 'res/drawable', dest: 'res/drawable' },
        { src: 'res/raw', dest: 'res/raw' },
        { src: 'res/values', dest: 'res/values' }
      ];

      function copyRecursive(src, dest) {
        if (fs.existsSync(src)) {
          if (fs.lstatSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(file => {
              copyRecursive(path.join(src, file), path.join(dest, file));
            });
          } else {
            console.log(`Plugin Copy: ${src} -> ${dest}`);
            fs.copyFileSync(src, dest);
          }
        }
      }

      mappings.forEach(m => {
        copyRecursive(path.join(srcBase, m.src), path.join(androidBase, m.dest));
      });

      return config;
    },
  ]);
}

module.exports = withMyCustomNative;
