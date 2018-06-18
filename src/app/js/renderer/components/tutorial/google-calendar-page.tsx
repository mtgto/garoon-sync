import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { WithStyles, withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import * as React from "react";
import { Calendar } from "../../../common/google";
import * as GoogleCalendar from "../../modules/google-calendar";
import { styles } from "../../styles";

export interface ConnectedDispatchProps {
    readonly reload: () => void;
    readonly submit: () => void;
    readonly handlePrev: () => void;
    readonly selectCalendar: (calendarId: string) => void;
}

export interface ConnectedState {
    readonly googleCalendar: GoogleCalendar.GoogleCalendarState;
}

type Props = ConnectedDispatchProps & ConnectedState & WithStyles<typeof styles>;

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
};

/**
 * 同期先のカレンダーの選択画面
 */
const GoogleCalendarPage = withStyles(styles)((props: Props) => (
    <>
        <h2>
            <Typography variant="headline">Google Calendarの設定</Typography>
        </h2>
        <Typography>
            <p>ガルーンのスケジュールと同期するGoogle Calendarを選択してください。</p>
            <p>
                もし新規にカレンダーを作りたい場合はWebブラウザでカレンダー作成してから「カレンダーをリロードする」ボタンを押して下さい
            </p>
        </Typography>
        <FormControl className={props.classes.formControl}>
            <InputLabel>同期するカレンダー</InputLabel>
            <Select
                autoWidth
                value={props.googleCalendar.calendarId || ""}
                onChange={e => props.selectCalendar(e.target.value)}
            >
                {props.googleCalendar.calendars.map((calendar, index) => (
                    <MenuItem value={calendar.id} key={index}>
                        {calendar.summary}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        <Button variant="flat" onClick={props.reload}>
            カレンダーをリロードする
        </Button>
        <br />
        <Typography>
            <p>{informationMessage(props)}</p>
        </Typography>
        <Button variant="raised" className={props.classes.button} onClick={props.handlePrev}>
            戻る
        </Button>
        <Button
            variant="raised"
            className={props.classes.button}
            color="primary"
            disabled={props.googleCalendar.calendarId === undefined}
            onClick={props.submit}
        >
            次へ
        </Button>
    </>
));

export default GoogleCalendarPage;
