import Button from "@material-ui/core/Button";
import { WithStyles, withStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import * as React from "react";
import * as Garoon from "../../modules/garoon";
import { styles } from "../../styles";

export interface ConnectedDispatchProps {
    readonly submit: () => void;
    readonly handlePrev: () => void;
    readonly setServerUrl: (serverUrl: string) => void;
    readonly setUsername: (username: string) => void;
    readonly setPassword: (password: string) => void;
}

export interface ConnectedState {
    readonly garoon: Garoon.GaroonState;
}

type Props = ConnectedDispatchProps & ConnectedState & WithStyles<typeof styles>;

const enum GaroonPageInputName {
    ServerUrl = "serverUrl",
    Username = "username",
    Password = "password",
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
};

const style: React.CSSProperties = {
    margin: 12,
};

const GaroonPage = withStyles(styles)((props: Props) => (
    <>
        <h2>
            <Typography variant="headline">ガルーンの設定</Typography>
        </h2>
        <Typography>
            <p>ガルーンのURL、ユーザーID、パスワードを入力して下さい。</p>
        </Typography>
        <TextField
            required
            className={props.classes.textField}
            name={GaroonPageInputName.ServerUrl}
            value={props.garoon.serverUrl.value}
            error={props.garoon.serverUrl.errorText !== undefined}
            placeholder="http://example.com/"
            helperText={props.garoon.serverUrl.errorText}
            type="url"
            label="ガルーンのURL"
            onChange={e => props.setServerUrl(e.target.value)}
        />
        <br />
        <TextField
            required
            className={props.classes.textField}
            name={GaroonPageInputName.Username}
            value={props.garoon.username.value}
            error={props.garoon.username.errorText !== undefined}
            helperText={props.garoon.username.errorText}
            label="ユーザーID"
            onChange={e => props.setUsername(e.currentTarget.value)}
        />
        <br />
        <TextField
            required
            className={props.classes.textField}
            name={GaroonPageInputName.Password}
            value={props.garoon.password.value}
            error={props.garoon.password.errorText !== undefined}
            helperText={props.garoon.password.errorText}
            type="password"
            label="パスワード"
            onChange={e => props.setPassword(e.currentTarget.value)}
        />
        <br />
        <Typography>
            <p>{informationMessage(props)}</p>
        </Typography>
        <Button variant="raised" style={style} onClick={props.handlePrev}>
            戻る
        </Button>
        <Button variant="raised" style={style} color="primary" onClick={props.submit}>
            次へ
        </Button>
    </>
));

export default GaroonPage;
