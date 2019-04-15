"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const extract_zip_1 = __importDefault(require("extract-zip"));
const fs_extra_1 = require("fs-extra");
const path_1 = __importDefault(require("path"));
const replace_1 = __importDefault(require("replace"));
const request_promise_native_1 = __importDefault(require("request-promise-native"));
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
const templateUrl = 'https://drive.google.com/uc?id=1vY70WkGnfbrJwcORZPP9iAi0tJSHjXJ3';
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
    await createReactNativeProject();
    process.chdir(appId);
    // パッケージの導入
    await installLibraries();
    // app IDの変更
    // android app id の変更
    changeAppId();
    // React Native ライブラリのリンク
    linkLibrary();
    // テンプレートの展開
    await extendsTemplate();
    //
    console.log('created meimy project.');
};
const createReactNativeProject = () => {
    return new Promise((resolve, reject) => {
        console.log('create react-native project.');
        const p = path_1.default.join(__dirname, './node_modules/.bin/react-native.cmd');
        const rnInit = child_process_1.spawn(p, ['init', appId, '--template', 'typescript']);
        spanLog(rnInit, resolve, reject);
    });
};
const linkLibrary = () => {
    console.log('link libraries.');
    child_process_1.spawnSync('./node_modules/.bin/react-native', ['link']);
};
const idTemplate = 'jp.co.ricoh.jrits.eim';
const changeAppId = () => {
    console.log('change app id.');
    // android
    const androidPath = path_1.default.join(cwd(), 'android/app');
    const gradleFile = path_1.default.join(androidPath, 'build.gradle');
    const manifestFile = path_1.default.join(androidPath, 'src/main/AndroidManifest.xml');
    const javaDir = path_1.default.join(androidPath, 'src/main/java/com/', appId);
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
    // Java のパスディレクトリを作成
    console.log(' > change java file in android.');
    const path = idTemplate.replace(/\./g, '/');
    const distPath = path_1.default.join(androidPath, 'src/main/java', path, appId);
    console.log(`${path} -> ${distPath}`);
    fs_extra_1.ensureDirSync(distPath);
    fs_extra_1.moveSync(javaDir, distPath);
};
const extendsTemplate = async () => {
    console.log('download template.');
    const body = await request_promise_native_1.default(templateUrl, { encoding: null });
    fs_extra_1.writeFileSync('./src.zip', body);
    console.log('expand template.');
    fs_extra_1.moveSync('./index.js', './_index.js');
    fs_extra_1.moveSync('./App.tsx', './_App.tsx');
    return new Promise((resolve, reject) => {
        extract_zip_1.default('./src.zip', { dir: cwd() }, (error) => {
            if (!error) {
                resolve();
            }
            else {
                reject(error);
            }
        });
    });
};
const installLibraries = () => {
    return new Promise((resolve, reject) => {
        console.log('install libraries');
        const yarn = child_process_1.spawn('yarn.cmd', ['add', ...dependencies]);
        spanLog(yarn, resolve, reject);
    }).then(() => {
        return new Promise((resolve, reject) => {
            const yarnDev = child_process_1.spawn('yarn.cmd', ['add', '--dev', ...devDependencies]);
            spanLog(yarnDev, resolve, reject);
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            const link = child_process_1.spawn('yarn.cmd', ['react-native', 'link']);
            spanLog(link, resolve, reject);
        });
    }).catch((error) => {
        console.error(error);
        throw error;
    });
};
const spanLog = (rnInit, resolve, reject) => {
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