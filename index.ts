#!/usr/bin/env node
import { spawn } from 'child_process';
import download from 'download';
import unzip from 'extract-zip';
import { ensureDirSync, moveSync, pathExistsSync } from 'fs-extra';
import Path from 'path';
import replace from 'replace';

const dependencies = [
    'clone',
    'ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-account-manager-parts.git',
    'ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-react-components.git',
    'ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-react-helper.git',
    'native-base',
    'react-native-file-viewer',
    'react-native-fs',
    'react-native-gesture-handler',
    'react-native-loading-spinner-overlay',
    'ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-service-client.git',
    'react-navigation',
    'react-navigation-redux-helpers',
    'react-redux',
    'redux-logger',
    'redux',
    'shortid',
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

// tslint:disable-next-line: max-line-length
const templateUrl = 'https://uc237fdfd9c700f37ab32aaa37af.dl.dropboxusercontent.com/cd/0/get/AfE4hxDlhLPBE7IEnZrXuRodYHUSIYNu1uPAtOyRgzlG9bdJpWZM7IXrplaHhK2OpMMpGEB4Q15E5A51DkTRKsxtDWTuoyTpqO6jgXNOcf7TdQ/file?_download_id=2888261723509631419089359306056371096951734941024743063022163223&_notify_domain=www.dropbox.com&dl=1';

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
    if (pathExistsSync(path)) {
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
    // Java のパスディレクトリを作成
    console.log(' > change java file in android.');
    const path = idTemplate.replace(/\./g, '/');
    const distPath = Path.join(androidAppPath, 'src/main/java', path, appId);
    console.log(`${path} -> ${distPath}`);
    ensureDirSync(distPath);
    moveSync(javaDir, distPath);
};

const extendsTemplate = async () => {
    console.log('download template.');
    try {
        await download(templateUrl, './');
        console.log('expand template.');
        moveSync('./index.js', './_index.js');
        moveSync('./App.tsx', './_App.tsx');
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
        await promiseSpawn('yarn.cmd', ['react-native', 'link', 'react-native-cookies']);
        return promiseSpawn('yarn.cmd', ['react-native', 'link', 'react-native-keychain']);
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
