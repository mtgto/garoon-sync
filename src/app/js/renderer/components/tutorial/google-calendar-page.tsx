import * as React from "react";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import {Calendar} from "../../../common/google";
import * as GoogleCalendar from "../../modules/google-calendar";

export interface ConnectedDispatchProps {
    readonly reload: () => void;
    readonly submit: () => void;
    readonly handlePrev: () => void;
    readonly selectCalendar: (event: any, index: number, menuItemValue: string) => void;
}

export interface ConnectedState {
    readonly googleCalendar: GoogleCalendar.GoogleCalendarState
}

type Props = ConnectedDispatchProps & ConnectedState;

const informationMessage = (props: Props): string => {
    switch (props.googleCalendar.calendarLoading.state) {
        case GoogleCalendar.CalendarLoadState.Initial:
            return " ";
        case GoogleCalendar.CalendarLoadState.Loading:
            return "ロード中です";
        case GoogleCalendar.CalendarLoadState.Loaded: {
            switch (props.googleCalendar.calendarLoading.result) {
                case GoogleCalendar.CalendarLoadResult.Success:
                    return "ロードが完了しました";
                case GoogleCalendar.CalendarLoadResult.Error:
                    return "ロードに失敗しました。もう一度試してみて下さい。";
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
 * 同期先のカレンダーの選択画面
 */
const GoogleCalendarPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2>Google Calendarの設定</h2>
        <p>ガルーンのスケジュールと同期するGoogle Calendarを選択してください。</p>
        <p>もし新規にカレンダーを作りたい場合はWebブラウザでカレンダー作成してから「カレンダーをリロードする」ボタンを押して下さい</p>
        <SelectField
            floatingLabelText="同期するカレンダー"
            value={props.googleCalendar.calendarId}
            onChange={props.selectCalendar}
        >
        {props.googleCalendar.calendars.map(calendar =>
            <MenuItem value={calendar.id} primaryText={calendar.summary}/>
        )}
        </SelectField>
        <FlatButton label="カレンダーをリロードする" onClick={props.reload}/><br/>
        <p>{informationMessage(props)}</p>
        <RaisedButton label="戻る" style={style} onClick={props.handlePrev}/>
        <RaisedButton
            label="次へ"
            style={style}
            primary={true}
            disabled={props.googleCalendar.calendarId === undefined}
            onClick={props.submit}
        />
    </div>;

export default GoogleCalendarPage;
