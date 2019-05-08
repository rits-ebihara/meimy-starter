# 一覧画面で項目タップしたらその文書を表示したい

## 考え方

一覧画面から遷移するのですが、汎用的な画面を作成するため、一覧画面との依存性をなくすことが必要です。

そのため、文書を表示する画面（EIMアプリでのフォームにあたる）を作成するときに、データの取得に必要な文書IDをプロパティとして受け取るようにします。

その画面を開いたときに、データのロードを開始し、ロードが完了したらその情報をプロパティとして受け取り、表示します。

データのロードは非同期で時間がかかる可能性があるので、スピナー（ロードを表示するためのぐるぐる回る画像）を表示します。

## 大まかな手順

1. 文書のデータ仕様となる、インターフェースを作成し、 State とする。
2. Reducer を作成し、Store に State を追加する。
3. 文書を表示する画面(Container Component)を作成する。
4. ローディング用の画像を表示・非表示するための Action と Reducer の処理を追加する。
5. 文書を表示する画面のローディングの表示・非表示を修正する。
6. 文書IDをステートにセットする Action と Reducer の処理を追加する。
7. Route (画面遷移定義) に 文書を表示する画面を登録する。
8. データを State にセットするための Action と Reducer の処理を追加する。
9. データを取得する処理を Action に追加する。
10. 文書を表示する画面を開いたときに、データのロードを開始する。
11. 一覧画面の項目でタップしたときに、文書を表示する画面を表示する Dispatch をコールする。

## 詳細な手順

###  文書のデータ仕様となる、インターフェースを作成し、 State とする。

表示するデータの定義（インターフェース）が必要となります。

そのデータは通常 EIM の文書のデータとなるため、下記様式となります。

```ts
interface doc {
    system: ISystem;
    property: any;
}
```

`system` については、Meimy が用意してある、`ISystem` インターフェースとなります。

`property` については、文書ごとに任意のものとなります。`any` 型でもよいのですが、より安全なコードとするために、インターフェースを定義することをおすすめします。

これについては、EIM APP デザイナ の文書モデル定義から、TypeScript のインターフェースファイルを生成するツールがあるので、これを使うと簡単に作成できます。

作成したファイルは、`src/states/` フォルダの下に配置します。

インストール

```bash
> yarn global add ssh://git@developer-ssh.jrits.ricoh.com:7999/eimmobile/meimy-utils.git
```

使い方

```bash
> meimy-create-state.cmd docmodel [EIM APP デザイナプロジェクトの文書モデルファイルのフルパス] [出力先フォルダのフルパス]
```

例:
```bash
meimy-create-state.cmd docmodel "C:\Users\user\Documents\EIM\meimy\MeimyTutorial\app1\document-model\DiaryModel.json" "C:\Users\user\Documents\temp\candy\src\states"
```

結果

```ts
// src/states/IDiaryModel.ts

export interface IDiaryModel {
    title: string;
    body: string;
    check: boolean;
}
```

EIM の文書の形式にする必要があります。
また、画面の制御等に利用するプロパティが必要であったり、になるので、下記のように加工します。

```ts
// src/states/IDiaryModel.ts

import { IDoc } from 'meimy';

export interface IDiaryModel {
    title: string;
    body: string;
    check: boolean;
}

export type IDiaryDoc = IDoc<IDiaryModel>;

interface IDiary {
    doc?: IDiaryDoc;
    docId: string; // 表示すべき文書の ID
    loading: boolean; // ロード中であることを示す
}

export default IDiary;
```

### Reducer を作成し、Store に State を追加する

上で作成した インターフェースを State とするため、Store に登録する必要がありますが、そのためには Reducer が必要です。

Reducer は、`src/reducers` に作成します。

```ts
// src/reducers/DiaryReducer.ts

import { createActionToReducerMapper } from 'meimy';
import { AnyAction, Reducer } from 'redux';

import IDiary from '../states/IDiaryModel';

// Action ごとの処理を追加するためのオブジェクト
const arm = createActionToReducerMapper<IDiary>();

// ここに後で Action ごとに State を変更する処理を書く

// 初期ステート
const initSttate: IDiary = {
    doc: undefined,
    docId: '',
    loading: false,
}

// Reducer 本体
const diaryReducer: Reducer<IDiary, AnyAction> = (state = initSttate, action) => {
    return arm.execute(state, action);
}

// デフォルトとする
export default diaryReducer;
```

Reducer を作成したので、Store に追加します。

まずは、Store のインターフェースに追加します。

```ts
// src/IState.ts

import { IAccountManagerState, IStateAtNavigation } from 'meimy';

import IDiary from './states/IDiaryModel';
import IDocList1State from './states/IDocList1State';
import ISplashState from './states/ISplashState';

export interface ICustomState extends IAccountManagerState {
    splash: ISplashState;
    docList1: IDocList1State;
    diary: IDiary; // <- 追加
}

type IState = IStateAtNavigation & ICustomState;

export default IState;
```

Store の実装に Reducer を登録します。

```ts
// src/Store.ts

// 略
import diaryReducer from './reducers/DiaryReducer'; // <- 追加

// 略
const reducer = combineReducers<IState>({
    ...accountReducers,
    // この下に独自の画面のReduxコンテナを定義する
    diary: diaryReducer,　// <- 追加
    docList1: docList1Reducer,
    nav: navReducer, // 必須
    splash: startReducer,
});
// 略
```

### 文書を表示する画面(Container Component)を作成する

上で作成したインターフェースをプロパティとして文書の内容を表示する画面を作成します。

この画面は、Redux の Container として作成します。

ファイルは、`src/views/containers` に作成します。

例：
```tsx
// src/views/containers/Diary.tsx

import { ICombinedNavProps, IProps } from 'meimy';
import { Container, Content, Item, Label, Spinner, Text } from 'native-base';
import { Component } from 'react';
import React from 'react';
import { connect } from 'react-redux';

import IState from '../../IState';
import IDiary from '../../states/IDiaryModel';
import theme from '../Styles';

type MyProps = ICombinedNavProps<IDiary>;

class Diary extends Component<MyProps> {
    public render = () => {
        const { state } = this.props;
        // 後ほどローディングの表示と切り替えるため、別メソッドで作成する
        const content = this.createContent();
        return (
            <Container>
                {content}
            </Container>
        );
    }
    private createContent = () => {
        const { doc } = this.props.state;
        if (!doc) { return null; }
        const docProps = doc.document.properties;
        return <Content>
            <Item stackedLabel>
                <Label>タイトル</Label>
                <Text>{docProps.title}</Text>
            </Item>
        </Content>;
    }
}
// Container としての実装
// State からこの画面の プロパティに変換する処理
const mapStateToProps = (state: IState): IProps<IDiary> => {
    return {
        state: state.diary,
    };
};
// Store と Component を連結して、Container とする。
export default connect(mapStateToProps)(Diary);
```

### ローディング用の画像を表示・非表示するための Action と Reducer の処理を追加する

画面を開いたときに、ロードを開始するのですが、ロードが完了するまで、ローディングの画像を表示します。

その制御も プロパティを通して行います。

#### ステートの修正

まず、ローディング中かどうかを示すプロパティを上記で作成した文書モデルのインターフェースに追加します。

```ts
// src/states/IDiaryModel.ts

// 略
interface IDiary {
    doc?: IDiaryDoc;
    docId: string;
    loading: boolean; // <-追加
}
// 略
```

#### Action の作成

次に追加した loading の値を変更するアクションを作成します。

アクションのファイルは、`src/actions/` フォルダに配置します。

ここでは、Action Creator は作成しません。Action Creator は、データをロードの開始、終了で作成されます。

```ts
// src/actions/DiaryActions.ts

import { Action } from 'redux';
import shortid from 'shortid';

// ローディングを ON にするアクション
export const SHOW_LOADING = 'SHOW_LOADING_' + shortid();

export interface IShowLoadingAction extends Action {
    // このアクションが呼ばれたら無条件に、loading = true とするので、アクションの値は無い。
}

// ローディングを ON にするアクション
export const HIDE_LOADING = 'HIDE_LOADING_' + shortid();

export interface IHideLoadingAction extends Action {
    // このアクションが呼ばれたら無条件に、loading = true とするので、アクションの値は無い。
}
```

#### Reducer の処理の追加

上で作成した Action に対応する Reducer の処理を追加します。

```ts
// src/reducers/DiaryReducer.ts

const arm = createActionToReducerMapper<IDiary>();
// 追加 ↓
arm.addWork<IShowLoadingAction>(SHOW_LOADING, (state, _action) => {
    state.loading = true;
});

arm.addWork<IHideLoadingAction>(HIDE_LOADING, (state, _action) => {
    state.loading = false;
});
// 追加 ↑
// 略
```

### 文書を表示する画面のローディングの表示・非表示を修正する

画面の方で、この値を見てスピナーの表示・非表示を行います。

```tsx
    public render = () => {
        const { state } = this.props;
        const content = this.createContent();
        return (
            <Container>
                // 変更 ↓
                {state.loading ?
                    <Spinner color={theme.brandPrimary} />
                    : content}
                // 変更 ↑
            </Container>
        );
    }
```

### 文書IDをステートにセットする Action と Reducer の処理を追加する

文書IDをステートにセットする処理を書きます。

まずは Action を追加します。

```ts
// src/actions/DiaryActions.ts

// 略
// 追加 ↓
// 文書ID をセットするためのアクション
export const SET_DOC_ID = 'SET_DOC_ID_' + shortid();

export interface ISetDocIdAction extends Action {
    docId: string;
}

export const createSetDocAction = (docId: string): ISetDocIdAction => {
    return {
        docId,
        type: SET_DOC_ID,
    };
};
```

このアクションに対応する Reducer を書きます。

```ts
// src/reducers/DiaryReducer.ts

// 略
// 追加↓
arm.addWork<ISetDocIdAction>(SET_DOC_ID, (state, action) => {
    state.docId = action.docId;
});
// 追加 ↑
// 略
```

### Route (画面遷移定義) に 文書を表示する画面を登録する

画面遷移の定義に、作成した画面を追加します。

まず画面に名前をつけるために、定数を定義します。

```ts
// src/RoutePageNames.ts

export default {
    allDialyList: 'DOC_LIST1',
    docListTab: 'DOC_LIST_TAB',
    drawerPage: 'DRAWER_PAGE',
    splash: 'SPLASH',
    diaryPage: 'DIARY', // <- 追加
};
```

Route の定義の実装に追加します。

```ts
// src/RouteConfigMap.ts

// 略

// サイドメニュー
const appDrawerConfigMap: NavigationRouteConfigMap = {};
appDrawerConfigMap[RoutePageNames.docListTab] = docListStackNav;

const drawerNav = createDrawerNavigator(appDrawerConfigMap, {
    contentComponent: AppDrawer,
    drawerLockMode: 'unlocked',
    initialRouteName: RoutePageNames.docListTab,
    navigationOptions: {
        header: null,
    }
});

// アプリ独自Stack
const appStackConfigMap: NavigationRouteConfigMap = {};
appStackConfigMap[RoutePageNames.drawerPage] = drawerNav;
appStackConfigMap[RoutePageNames.diaryPage] = Diary; // <- 追加
const appStackNav = createStackNavigator(appStackConfigMap, {
    defaultNavigationOptions: {
        headerTintColor: theme.inverseTextColor,
        headerStyle: {
            backgroundColor: colorPallet.$colorPrimary3,
        },
    }
});

// 全体の画面 Route
const rootRouteConfigMap: NavigationRouteConfigMap = {};
rootRouteConfigMap[RoutePageNames.splash] = Splash; // スプラッシュ画面
rootRouteConfigMap[routePageNames.authPageName] = authStackNav; // 認証画面スタック
rootRouteConfigMap['app_stack'] = appStackNav;
const rootNav = createSwitchNavigator(rootRouteConfigMap, {
    initialRouteName: RoutePageNames.splash, // 初期ページ
});

export default rootNav;
```

### データを State にセットするための Action と Reducer の処理を追加する

データを取得する処理の前に、取得できたあとにデータをセットする処理を書きます。

```ts
// src/actions/DiaryActions.ts

// 略

// 追加 ↓
// データをセットするためのアクション
export const SET_DIARY_DOC_DATA = 'SET_DIARY_DOC_DATA_' + shortid();

export interface ISetDiaryDocDataAction extends Action {
    data: IDiaryDoc;
}

export const createSetDiaryDocDataAction = (data: IDiaryDoc): ISetDiaryDocDataAction => {
    return {
        data,
        type: SET_DIARY_DOC_DATA,
    };
};
```

Reducer に処理を追加します。

```ts
// src/reducers/DiaryReducer.ts

// 略
// 追加 ↓
arm.addWork<ISetDiaryDocDataAction>(SET_DIARY_DOC_DATA, (state, action) => {
    state.doc = action.data;
    state.loading = false; // データをセットしたら、ローディング停止
});
// 追加 ↑
```

### データを取得する処理を Action に追加する

EIMのAPIをコールし、データを取得する処理を書きます。

これは、Action で（正確には ActionCreator）で処理します。

```ts
// src/actions/DiaryActions.ts

// 略
// 追加 ↓
// データをロードするアクション
export const createLoadDiaryDocAction = (docId: string, dispatch: Dispatch, onError?: Function): IShowLoadingAction => {
    const adapter = eimAccount.getServiceAdapter();
    adapter.getDocumentById<IDiaryModel>(eimAccount.eimTokens, docId).then(data => {
        if (data.statusCode === 200) {
            dispatch(createSetDiaryDocDataAction(data.parsedBody!));
        } else {
            if (!!onError) {
                onError();
            }
        }
    }).catch(() => {
        if (!!onError) {
            onError();
        }
    });

    // スピナーを表示するためのアクションを変えず
    return {
        type: SHOW_LOADING,
    };
};
```

### 文書を表示する画面を開いたときに、データのロードを開始する

上で作成した文書を表示する画面を開いたとき(=componentDidMount)に、データのロードを開始する処理を実装します。

componentDidMount とは、React のイベントで、はじめに描画処理が完了したときの処理を書きます。
描画後、１回のみの動作となります。詳細→[React Lifecycle - Qiita](https://qiita.com/f-a24/items/40b83d4c6c7d147cda9e)

```ts
// src/views/containers/Diary.tsx

// 略
class Diary extends Component<MyProps> {
    public render = () => {
        // 略
    }
    // 追加 ↓
    public componentDidMount = () => {
        const { docId } = this.props.state;
        const { dispatch } = this.props;
        if (!docId) { return; }
        dispatch(createLoadDiaryDocAction(docId, dispatch));
    }
    // 追加 ↑
    // 略
}
```


### 一覧画面の項目でタップしたときに、文書を表示する画面を表示する Dispatch をコールする

最後に、文書一覧をタップしたときの処理を追加します。

行ごとの Element を作成しているところで、押した時のイベント(onPress)に処理を書きます。

```tsx
// src/views/containers/AllDialyList.tsx

// 略
class AllDialyList extends Component<MyProps> {
    // 略
    private rowElement: CreateRowElement<IDialyDocList> = (item, cols) => {
        return (
            <ListItem key={item.documentId} button
                style={{ backgroundColor: 'transparent' }}
                onPress={this.onPressAtListItem.bind(this, item.documentId)}> // <- onPress 追加
                <Text>{cols['properties.title']}</Text>
            </ListItem>);
    }
    // onPress の処理を追加
    private onPressAtListItem = (docId: string) => {
        // 文書を表示する画面のステートを更新
        this.props.dispatch(createSetDocIdAction(docId));
        // 画面を遷移する
        this.props.navigation.navigate(RoutePageNames.diaryPage);
    }
}
// 略
```
