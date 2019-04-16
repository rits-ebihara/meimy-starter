"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const download_1 = __importDefault(require("download"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const replace_1 = __importDefault(require("replace"));
// import request from 'request-promise-native';
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
    const path = path_1.default.parse(cwd());
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
        const rnInit = child_process_1.spawn('react-native.cmd', ['init', appId, '--template', 'typescript']);
        spawnLog(rnInit, resolve, reject);
    });
};
const checkExistAppDir = () => {
    const path = path_1.default.join(cwd(), appId);
    if (fs_extra_1.pathExistsSync(path)) {
        console.log(`"${path}" exists.
Delete this directory or specify another app id.`);
        process.exit(1);
    }
};
const idTemplate = 'jp.co.ricoh.jrits.eim';
const changeAppId = () => {
    console.log('change app id.');
    // android
    const androidPath = path_1.default.join(cwd(), 'android');
    const globalGradlePath = path_1.default.join(androidPath, 'build.gradle');
    const androidAppPath = path_1.default.join(androidPath, 'app');
    const gradleFile = path_1.default.join(androidAppPath, 'build.gradle');
    const manifestFile = path_1.default.join(androidAppPath, 'src/main/AndroidManifest.xml');
    const javaDir = path_1.default.join(androidAppPath, 'src/main/java/com/', appId);
    const javaFiles = [
        path_1.default.join(javaDir, 'MainActivity.java'),
        path_1.default.join(javaDir, 'MainApplication.java'),
    ];
    // ファイル の修正
    replace_1.default({
        paths: [gradleFile, manifestFile, ...javaFiles],
        recursive: true,
        regex: 'com\\.' + appId,
        replacement: idTemplate + '.' + appId,
        silent: false,
    });
    replace_1.default({
        paths: [globalGradlePath],
        recursive: false,
        regex: 'minSdkVersion = 16',
        replacement: 'minSdkVersion = 21',
        silent: false,
    });
    // Java のパスディレクトリを作成
    console.log(' > change java file in android.');
    const path = idTemplate.replace(/\./g, '/');
    const distPath = path_1.default.join(androidAppPath, 'src/main/java', path, appId);
    console.log(`${path} -> ${distPath}`);
    fs_extra_1.ensureDirSync(distPath);
    fs_extra_1.moveSync(javaDir, distPath);
};
const extendsTemplate = async () => {
    console.log('download template.');
    try {
        await download_1.default(templateUrl, './');
        console.log('expand template.');
        fs_extra_1.moveSync('./index.js', './_index.js');
        fs_extra_1.moveSync('./App.tsx', './_App.tsx');
        return new Promise((resolve, reject) => {
            extract_zip_1.default('./meimy-starter-src.zip', { dir: cwd() }, (error) => {
                if (!error) {
                    resolve();
                }
                else {
                    reject(error);
                }
            });
        });
    }
    catch (e) {
        console.error(`Download Failed.(${templateUrl})`);
        process.exit(1);
    }
};
const installLibraries = async () => {
    try {
        await new Promise((resolve, reject) => {
            console.log('install libraries');
            const yarn = child_process_1.spawn('yarn.cmd', ['add', ...dependencies]);
            spawnLog(yarn, resolve, reject);
        });
        await promiseSpawn('yarn.cmd', ['add', '--dev', ...devDependencies]);
        await promiseSpawn('yarn.cmd', ['react-native', 'link']);
        await promiseSpawn('yarn.cmd', ['react-native', 'link', 'react-native-cookies']);
        return promiseSpawn('yarn.cmd', ['react-native', 'link', 'react-native-keychain']);
    }
    catch (error) {
        console.error(error);
        throw error;
    }
};
const promiseSpawn = (com, options) => {
    return new Promise((resolve, reject) => {
        const s = child_process_1.spawn(com, options);
        spawnLog(s, resolve, reject);
    });
};
const spawnLog = (rnInit, resolve, reject) => {
    rnInit.stdout.setEncoding('utf-8');
    rnInit.stderr.setEncoding('utf-8');
    rnInit.stdout.on('data', (data) => {
        console.log(data);
    });
    rnInit.stderr.on('data', (data) => {
        console.error(data);
    });
    rnInit.on('close', (data) => {
        if (data === 0) {
            resolve();
        }
        else {
            reject();
        }
    });
};
createApp().then(() => {
    process.exit(0);
}).catch((error) => {
    throw error;
});
//# sourceMappingURL=index.js.map