import * as React from "react";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
import * as GoogleCalendar from "../../modules/google-calendar";

export interface ConnectedDispatchProps {
    readonly openAuthorizationView: () => void
    readonly submit: () => void
    readonly handlePrev: () => void
    readonly setAuthorizationCode: (code: string) => void
}

export interface ConnectedState {
    readonly googleCalendar: GoogleCalendar.GoogleCalendarState
}

type Props = ConnectedDispatchProps & ConnectedState;

const informationMessage = (props: Props): string => {
    switch (props.googleCalendar.verifying.state) {
        case GoogleCalendar.CodeVerifyState.Initial:
            return " ";
        case GoogleCalendar.CodeVerifyState.Verifying:
            return "チェック中です";
        case GoogleCalendar.CodeVerifyState.Verified: {
            switch (props.googleCalendar.verifying.result) {
                case GoogleCalendar.CodeVerifyResult.Valid:
                    return "チェックが完了しました";
                case GoogleCalendar.CodeVerifyResult.Invalid:
                    return "コードがおかしいようです";
                case GoogleCalendar.CodeVerifyResult.Error:
                    return "チェックに失敗しました。もう一度試してみて下さい。";
                default:
                    return " ";
            }
        }
    }
}

const style: React.CSSProperties = {
    margin: 12
};

/**
 * OAuthアクセストークンの取得画面（実際の認可はWebブラウザで行う）
 */
const GoogleAuthPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2>Google Calendarの設定</h2>
        <p>ガルーンのスケジュールと同期するGoogle Calendarの設定を行います。</p>
        <p>下のボタンを押すとブラウザが開きます. 認可後に表示されるコードを入力して「次へ」ボタンを押して下さい</p>
        <FlatButton
            label="認可画面をWebブラウザで開く"
            secondary={true}
            onTouchTap={props.openAuthorizationView}
        /><br/>
        <TextField
            name="code"
            value={props.googleCalendar.authorizationCode}
            floatingLabelText="認可コード"
            onChange={(e: React.FormEvent<HTMLInputElement>) => props.setAuthorizationCode(e.currentTarget.value)}
        /><br/>
        <p>{informationMessage(props)}</p>
        <RaisedButton label="戻る" style={style} onTouchTap={props.handlePrev}/>
        <RaisedButton
            label="次へ"
            style={style}
            primary={true}
            disabled={props.googleCalendar.authorizationCode.length === 0}
            onTouchTap={props.submit}
        />
    </div>;

export default GoogleAuthPage;
