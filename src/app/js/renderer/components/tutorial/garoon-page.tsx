import * as React from "react";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
import * as Garoon from "../../modules/garoon";

export interface ConnectedDispatchProps {
    readonly submit: () => void;
    readonly handlePrev: () => void;
    readonly setServerUrl: (serverUrl: string) => void;
    readonly setUsername: (username: string) => void;
    readonly setPassword: (password: string) => void;
}

export interface ConnectedState {
    readonly garoon: Garoon.GaroonState
}

type Props = ConnectedDispatchProps & ConnectedState;

const enum GaroonPageInputName {
    ServerUrl = "serverUrl",
    Username = "username",
    Password = "password"
}

const informationMessage = (props: Props): string => {
    switch (props.garoon.verifying.state) {
        case Garoon.VerifyState.Initial:
            return " ";
        case Garoon.VerifyState.Verifying:
            return "チェック中です";
        case Garoon.VerifyState.Verified: {
            switch (props.garoon.verifying.result) {
                case Garoon.VerifyResult.Valid:
                    return "チェックが完了しました";
                case Garoon.VerifyResult.Invalid:
                    return "アカウント情報がおかしいようです";
                case Garoon.VerifyResult.Error:
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

const GaroonPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2>ガルーンの設定</h2>
        <p>ガルーンのURL、ユーザーID、パスワードを入力して下さい。</p>
        <TextField
            name={GaroonPageInputName.ServerUrl}
            value={props.garoon.serverUrl.value}
            hintText="http://example.com/"
            errorText={props.garoon.serverUrl.errorText}
            floatingLabelText="ガルーンのURL"
            onChange={(e: React.FormEvent<HTMLInputElement>) => props.setServerUrl(e.currentTarget.value)}
        /><br/>
        <TextField
            name={GaroonPageInputName.Username}
            value={props.garoon.username.value}
            errorText={props.garoon.username.errorText}
            floatingLabelText="ユーザーID"
            onChange={(e: React.FormEvent<HTMLInputElement>) => props.setUsername(e.currentTarget.value)}
        /><br/>
        <TextField
            name={GaroonPageInputName.Password}
            value={props.garoon.password.value}
            errorText={props.garoon.password.errorText}
            type="password"
            floatingLabelText="パスワード"
            onChange={(e: React.FormEvent<HTMLInputElement>) => props.setPassword(e.currentTarget.value)}
        /><br/>
        <p>{informationMessage(props)}</p>
        <RaisedButton label="戻る" style={style} onClick={props.handlePrev}/>
        <RaisedButton
            label="次へ"
            style={style}
            primary={true}
            onClick={props.submit}
        />
    </div>;

export default GaroonPage;
