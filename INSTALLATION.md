![](http://escornabot.com/web/sites/default/files/logo_0.png)
# Installation
First of all, please, install React Native following this guidelines: [https://facebook.github.io/react-native/docs/getting-started.html](https://facebook.github.io/react-native/docs/getting-started.html). You need to have installed [node](https://nodejs.org/es/) and [npm](https://docs.npmjs.com/getting-started/installing-node) (node package manager). Usually installing node you don't need to install npm, is included in the package.

Recommended install `react-native-cli` with `npm install -g react-native-cli` globally too.

**Essential tools**: `node`, `npm` and `react-native` command line client. To make possible compile for each platform, iOS and Android, you must have XCode, Command Line Tools and Android SDK (with last java updated, gradle... I recommend Android Studio to automatize this questions).

1. Clone repository with `git clone` or some Github GUI.
2. Inside app directory, root, execute `npm install` and wait for all node_modules wass installed.
3. Execute app with `react-native run-ios` or `react-native run-android` for each platform. If you preffer execute under XCode or Android Studio, it's ok.


## 06/01/2019 installation issues on iOS
* Due to React Native 0.52.1 version is possible to experience issues with 'third-party' directory on react-native module (inside **node_modules** directory). If you've got a error message with glog library, please, go to (in my case 0.3.4): <br><br>`node_modules/react-native/third-party/glog-0.3.4`
<br><br>And inside this directory put in the terminal: `../../scripts/ios-configure-glog.sh` to make `config.h` file available for XCode.

* If you've got a `libfishhook.a` file error warning for **RCTWebSocket.xcodeproject**, please got to Library folder, remove and add again:
![](https://user-images.githubusercontent.com/2400215/45737941-92981200-bc08-11e8-80fc-978147db7a9a.png)

* If you've got warnings or errors with **react-native-vector-icons** or **react-native-ble-manager** linking with XCode Project, please, put in terminal: `react-native link react-native-vector-icons` and/or `react-native link react-native-ble-manager`.