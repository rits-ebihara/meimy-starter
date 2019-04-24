#!/usr/bin/env node
import { spawn } from 'child_process';
import download from 'download';
import unzip from 'extract-zip';
import * as fs from 'fs-extra';
import Path from 'path';
import replace from 'replace';

const dependencies = [
    'clone',
    'native-base',
    'react-native-cookies',
    'react-native-device-info',
    'react-native-file-viewer',
    'react-native-fs',
    'react-native-keychain',
    'react-native-gesture-handler',
    'react-native-loading-spinner-overlay',
    'react-native-screens',
    'react-navigation-redux-helpers',
    'react-navigation',
    'react-redux',
    'redux-logger',
    'redux',
    'shortid',
    'ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-tools.git',
    'url-parse',
];

const devDependencies = [
    '@types/clone',
    '@types/react-native-loading-spinner-overlay',
    '@types/react-navigation',
    '@types/react-redux',
    '@types/redux',
    '@types/shortid',
    '@types/url-parse',
    'tslint',
];

const addJavaCode1 = `import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.os.Bundle;
import com.facebook.react.ReactFragmentActivity;`;

const addJavaCode2 = `public class MainActivity extends ReactFragmentActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
    }
    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
      return new ReactActivityDelegate(this, getMainComponentName()) {
        @Override
        protected ReactRootView createRootView() {
         return new RNGestureHandlerEnabledRootView(MainActivity.this);
        }
      };
    }`;

// tslint:disable-next-line: max-line-length
const templateUrl = 'https://www.dropbox.com/s/hxv0pkre1agkx3t/meimy-starter-src.zip?dl=1';

const { argv } = process;

const { cwd } = process;

if (argv.length !== 4) {
    console.log(`meimy-starter [command] [app-id]
command ... 'init', 'rename'
app-id ... application id. alphabet only. ex. 'decitionformat'`);
    process.exit(1);
}

const command = argv[2];
const appId = argv[3];
const createApp = async () => {
    const path = Path.parse(cwd());
    if (path.name === 'meimy-starter') {
        return;
    }
    checkExistAppDir();
    await createReactNativeProject();
    process.chdir(appId);
    // パッケージの導入
    await installLibraries();
    // app IDの変更
    // android app id の変更
    changeAppId();
    // テンプレートの展開
    await extendsTemplate();
    //
    console.log('created meimy project.');
};

const createReactNativeProject = () => {
    return new Promise((resolve, reject) => {
        console.log('create react-native project.');
        const rnInit = spawn('react-native.cmd', ['init', appId, '--template', 'typescript']);
        spawnLog(rnInit, resolve, reject);
    });
};

const checkExistAppDir = () => {
    const path = Path.join(cwd(), appId);
    if (fs.pathExistsSync(path)) {
        console.log(`"${path}" exists.
Delete this directory or specify another app id.`);
        process.exit(1);
    }
};

const idTemplate = 'jp.co.ricoh.jrits.eim';

const changeAppId = () => {
    console.log('change app id.');
    // android
    const androidPath = Path.join(cwd(), 'android');
    const globalGradlePath = Path.join(androidPath, 'build.gradle');
    const androidAppPath = Path.join(androidPath, 'app');
    const gradleFile = Path.join(androidAppPath, 'build.gradle');
    const manifestFile = Path.join(androidAppPath, 'src/main/AndroidManifest.xml');
    const javaDir = Path.join(androidAppPath, 'src/main/java/com/', appId);
    const javaFiles = [
        Path.join(javaDir, 'MainActivity.java'),
        Path.join(javaDir, 'MainApplication.java'),
    ];

    // ファイル の修正
    replace({
        paths: [gradleFile, manifestFile, ...javaFiles],
        recursive: true,
        regex: 'com\\.' + appId,
        replacement: idTemplate + '.' + appId,
        silent: false,
    });
    replace({
        paths: [globalGradlePath],
        recursive: false,
        regex: 'minSdkVersion = 16',
        replacement: 'minSdkVersion = 21',
        silent: false,
    });
    replace({
        paths: [Path.join(javaDir, 'MainActivity.java')],
        recursive: false,
        regex: 'import com\\.facebook\\.react\\.ReactActivity;',
        replacement: addJavaCode1,
        silent: false,
    });
    replace({
        paths: [Path.join(javaDir, 'MainActivity.java')],
        recursive: false,
        regex: 'public class MainActivity extends ReactActivity {',
        replacement: addJavaCode2,
        silent: false,
    });
    // Java のパスディレクトリを作成
    console.log(' > change java file in android.');
    const path = idTemplate.replace(/\./g, '/');
    const distPath = Path.join(androidAppPath, 'src/main/java', path, appId);
    console.log(`${path} -> ${distPath}`);
    fs.ensureDirSync(distPath);
    fs.moveSync(javaDir, distPath);
};

const extendsTemplate = async () => {
    console.log('download template.');
    try {
        await download(templateUrl, './');
        console.log('expand template.');
        fs.removeSync('./index.js');
        fs.removeSync('./App.tsx');
        return new Promise((resolve, reject) => {
            unzip('./meimy-starter-src.zip', { dir: cwd() }, (error: any) => {
                if (!error) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    } catch (e) {
        console.error(`Download Failed.(${templateUrl})`);
        process.exit(1);
    }
};

const installLibraries = async () => {
    try {
        await new Promise((resolve, reject) => {
            console.log('install libraries');
            const yarn = spawn('yarn.cmd', ['add', ...dependencies]);
            spawnLog(yarn, resolve, reject);
        });
        await promiseSpawn('yarn.cmd', ['add', '--dev', ...devDependencies]);
        await promiseSpawn('yarn.cmd', ['react-native', 'link']);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const promiseSpawn = (com: string, options: string[]) => {
    return new Promise((resolve, reject) => {
        const s = spawn(com, options);
        spawnLog(s, resolve, reject);
    });
};
const spawnLog = (
    rnInit: import('child_process').ChildProcessWithoutNullStreams,
    resolve: (value?: {} | PromiseLike<{}> | undefined) => void,
    reject: (reason?: any) => void,
) => {
    rnInit.stdout.setEncoding('utf-8');
    rnInit.stderr.setEncoding('utf-8');
    rnInit.stdout.on('data', (data) => {
        console.log(data);
    });
    rnInit.stderr.on('data', (data) => {
        console.error(data);
    });
    rnInit.on('close', (data: number) => {
        if (data === 0) {
            resolve();
        } else {
            reject();
        }
    });
};

createApp().then(() => {
    process.exit(0);
}).catch((error) => {
    throw error;
});
