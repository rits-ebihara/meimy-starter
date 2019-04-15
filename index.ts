import { spawn, spawnSync } from 'child_process';
import unzip from 'extract-zip';
import { ensureDirSync, moveSync, writeFileSync } from 'fs-extra';
import Path from 'path';
import replace from 'replace';
import request from 'request-promise-native';

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
    const path = Path.parse(cwd());
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
        const rnInit = spawn('react-native-cli.cmd', ['init', appId, '--template', 'typescript']);
        spanLog(rnInit, resolve, reject);
    });
};

const linkLibrary = () => {
    console.log('link libraries.');
    spawnSync('./node_modules/.bin/react-native', ['link']);
};

const idTemplate = 'jp.co.ricoh.jrits.eim';

const changeAppId = () => {
    console.log('change app id.');
    // android
    const androidPath = Path.join(cwd(), 'android/app');
    const gradleFile = Path.join(androidPath, 'build.gradle');
    const manifestFile = Path.join(androidPath, 'src/main/AndroidManifest.xml');
    const javaDir = Path.join(androidPath, 'src/main/java/com/', appId);
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
    // Java のパスディレクトリを作成
    console.log(' > change java file in android.');
    const path = idTemplate.replace(/\./g, '/');
    const distPath = Path.join(androidPath, 'src/main/java', path, appId);
    console.log(`${path} -> ${distPath}`);
    ensureDirSync(distPath);
    moveSync(javaDir, distPath);
};

const extendsTemplate = async () => {
    console.log('download template.');
    const body = await request(templateUrl, { encoding: null });
    writeFileSync('./src.zip', body);
    console.log('expand template.');
    moveSync('./index.js', './_index.js');
    moveSync('./App.tsx', './_App.tsx');
    return new Promise((resolve, reject) => {
        unzip('./src.zip', { dir: cwd() }, (error: any) => {
            if (!error) {
                resolve();
            } else {
                reject(error);
            }
        });
    });
};

const installLibraries = () => {
    return new Promise((resolve, reject) => {
        console.log('install libraries');
        const yarn = spawn('yarn.cmd', ['add', ...dependencies]);
        spanLog(yarn, resolve, reject);
    }).then(() => {
        return new Promise((resolve, reject) => {
            const yarnDev = spawn('yarn.cmd', ['add', '--dev', ...devDependencies]);
            spanLog(yarnDev, resolve, reject);
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            const link = spawn('yarn.cmd', ['react-native', 'link']);
            spanLog(link, resolve, reject);
        });
    }).catch((error) => {
        console.error(error);
        throw error;
    });
};

const spanLog = (
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
