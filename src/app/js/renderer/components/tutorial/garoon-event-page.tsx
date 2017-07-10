import * as React from "react";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";
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
    margin: 12
};

const GaroonEventPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2>ガルーンのスケジュールページURLの設定</h2>
        <p>あなたがお使いのガルーンのスケジュールページのURLの "?" より前の部分までを入力して下さい。</p>
        <p>この設定はGoogleカレンダーへの同期の際、ガルーンのスケジュールページへのリンクのために使われます。</p>
        <TextField
            value={props.garoon.eventPageUrl.value}
            hintText="例: http://example.com/grn/schedule/view.csp"
            floatingLabelText="ガルーンのスケジュールURL"
            onChange={(e: React.FormEvent<HTMLInputElement>) => props.setEventPageUrl(e.currentTarget.value)}
            fullWidth={true}
        /><br/>
        <RaisedButton label="戻る" style={style} onTouchTap={props.handlePrev}/>
        <RaisedButton
            label="次へ"
            style={style}
            disabled={!props.garoon.eventPageUrl.valid}
            primary={true}
            onTouchTap={props.submit}
        />
    </div>

export default GaroonEventPage;
