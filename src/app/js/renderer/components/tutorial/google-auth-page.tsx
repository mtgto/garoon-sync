import Button from "@material-ui/core/Button";
import { WithStyles, withStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import * as React from "react";
import * as GoogleCalendar from "../../modules/google-calendar";
import { styles } from "../../styles";

export interface ConnectedDispatchProps {
    readonly openAuthorizationView: () => void;
    readonly submit: () => void;
    readonly handlePrev: () => void;
    readonly setAuthorizationCode: (code: string) => void;
}

export interface ConnectedState {
    readonly googleCalendar: GoogleCalendar.GoogleCalendarState;
}

type Props = ConnectedDispatchProps & ConnectedState & WithStyles<typeof styles>;

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
};

const style: React.CSSProperties = {
    margin: 12,
};

/**
 * OAuthアクセストークンの取得画面（実際の認可はWebブラウザで行う）
 */
const GoogleAuthPage = withStyles(styles)((props: Props) => (
    <>
        <h2>Google Calendarの設定</h2>
        <p>ガルーンのスケジュールと同期するGoogle Calendarの設定を行います。</p>
        <p>下のボタンを押すとブラウザが開きます. 認可後に表示されるコードを入力して「次へ」ボタンを押して下さい</p>
        <Button variant="flat" color="secondary" onClick={props.openAuthorizationView}>
            認可画面をWebブラウザで開く
        </Button>
        <br />
        <TextField
            fullWidth
            name="code"
            value={props.googleCalendar.authorizationCode}
            label="認可コード"
            onChange={(e: React.FormEvent<HTMLInputElement>) => props.setAuthorizationCode(e.currentTarget.value)}
        />
        <br />
        <p>{informationMessage(props)}</p>
        <Button variant="raised" style={style} onClick={props.handlePrev}>
            戻る
        </Button>
        <Button
            variant="raised"
            style={style}
            color="primary"
            disabled={props.googleCalendar.authorizationCode.length === 0}
            onClick={props.submit}
        >
            次へ
        </Button>
    </>
));

export default GoogleAuthPage;
