import * as React from "react";
import RaisedButton from "material-ui/RaisedButton";

export interface Props {
    readonly handleNext: () => void
};

const FirstPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2>セットアップ</h2>
        <p>Garoon-Syncにようこそ。</p>
        <p>このアプリはガルーンのスケジュールをGoogle Calendarに同期することができます。</p>
        <p>セットアップ中にガルーンのアカウントとGoogle Calendarとの同期設定を行います。</p>
        <p>それでは次へボタンを押して次に進んで下さい。</p>
        <RaisedButton label="次へ" primary={true} onClick={props.handleNext}
        />
    </div>;

export default FirstPage;
