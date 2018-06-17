import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import * as React from "react";
import * as Garoon from "../../modules/garoon";

export interface ConnectedDispatchProps {
    readonly submit: () => void;
    readonly handlePrev: () => void;
    readonly setEventPageUrl: (eventPageUrl: string) => void;
}

export interface ConnectedState {
    readonly garoon: Garoon.GaroonState;
}

type Props = ConnectedDispatchProps & ConnectedState;

const style: React.CSSProperties = {
    margin: 12,
};

const GaroonEventPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2><Typography variant="headline">ガルーンのスケジュールページURLの設定</Typography></h2>
        <Typography>
        <p>あなたがお使いのガルーンのスケジュールページのURLの "?" より前の部分までを入力して下さい。</p>
        <p>例えばある予定のURLが http://example.com/view.csp?event=123 なら http://example.com/view.csp を入れて下さい。</p>
        <p>この設定はGoogleカレンダーへの同期の際、Googleカレンダーの予定からガルーンのスケジュールページへのリンクのために使われます。</p>
        </Typography>
        <TextField
            required
            value={props.garoon.eventPageUrl.value}
            helperText="例: http://example.com/grn/schedule/view.csp"
            label="ガルーンのスケジュールURL"
            onChange={e => props.setEventPageUrl(e.target.value)}
            fullWidth
        /><br/>
        <Button variant="raised" style={style} onClick={props.handlePrev}>戻る</Button>
        <Button
            variant="raised"
            style={style}
            disabled={!props.garoon.eventPageUrl.valid}
            color="primary"
            onClick={props.submit}
        >次へ
        </Button>
    </div>;

export default GaroonEventPage;
