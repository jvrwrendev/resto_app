/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

const LIB_PATH = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-escpos-printer',
);

const PODSPEC = `require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'RNBluetoothEscposPrinter'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = 'https://github.com/januslo/react-native-bluetooth-escpos-printer'
  s.license      = package['license']
  s.author       = package['author']
  s.platform     = :ios, '12.0'
  s.source       = { :git => 'https://github.com/januslo/react-native-bluetooth-escpos-printer.git', :tag => "v#{s.version}" }
  s.source_files = 'ios/*.{h,m}', 'ios/ZXingObjC-3.2.2/ZXingObjC/**/*.{h,m}'
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '"\${PODS_TARGET_SRCROOT}/ios/ZXingObjC-3.2.2"',
    'CLANG_WARN_DOCUMENTATION_COMMENTS' => 'NO',
  }
  s.dependency 'React-Core'
end
`;

const ANDROID_GRADLE = `apply plugin: 'com.android.library'

android {
    namespace 'cn.jystudio.bluetooth'
    compileSdkVersion 36

    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 36
        versionCode 1
        versionName "1.0"
    }

    lintOptions {
        abortOnError false
    }
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
    implementation 'com.google.zxing:core:3.3.0'
    implementation 'androidx.core:core:1.15.0'
}
`;

function withBluetoothPrinter(config) {
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podspecPath = path.join(LIB_PATH, 'RNBluetoothEscposPrinter.podspec');
      if (fs.existsSync(LIB_PATH) && !fs.existsSync(podspecPath)) {
        fs.writeFileSync(podspecPath, PODSPEC);
      }
      return cfg;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const gradlePath = path.join(LIB_PATH, 'android', 'build.gradle');
      if (fs.existsSync(LIB_PATH)) {
        fs.writeFileSync(gradlePath, ANDROID_GRADLE);
      }

      const managerJavaPath = path.join(
        LIB_PATH,
        'android',
        'src',
        'main',
        'java',
        'cn',
        'jystudio',
        'bluetooth',
        'RNBluetoothManagerModule.java',
      );
      if (fs.existsSync(managerJavaPath)) {
        const source = fs.readFileSync(managerJavaPath, 'utf8');
        const patched = source
          .replace(
            'import android.support.v4.app.ActivityCompat;',
            'import androidx.core.app.ActivityCompat;',
          )
          .replace(
            'import android.support.v4.content.ContextCompat;',
            'import androidx.core.content.ContextCompat;',
          );
        if (patched !== source) {
          fs.writeFileSync(managerJavaPath, patched);
        }
      }

      return cfg;
    },
  ]);

  return config;
}

module.exports = withBluetoothPrinter;