import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import * as React from "react";

export interface ConnectedDispatchProps {
    readonly handleNext: () => void;
}

type Props = ConnectedDispatchProps;

const FirstPage: React.StatelessComponent<Props> = (props: Props) => (
    <div>
        <h2>
            <Typography variant="headline">セットアップ</Typography>
        </h2>
        <Typography>
            <p>Garoon-Syncにようこそ。</p>
            <p>このアプリはガルーンのスケジュールをGoogle Calendarに同期することができます。</p>
            <p>セットアップ中にガルーンのアカウントとGoogle Calendarとの同期設定を行います。</p>
            <p>それでは次へボタンを押して次に進んで下さい。</p>
        </Typography>
        <Button variant="raised" color="primary" onClick={e => props.handleNext()}>
            次へ
        </Button>
    </div>
);

export default FirstPage;
