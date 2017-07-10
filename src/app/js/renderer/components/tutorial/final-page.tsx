import * as React from "react";
import RaisedButton from "material-ui/RaisedButton";
import Checkbox from "material-ui/Checkbox";
import NotificationSync from "material-ui/svg-icons/notification/sync";
import NotificationSyncDisabled from "material-ui/svg-icons/notification/sync-disabled";
import {TutorialState} from "../../modules/tutorial";

export interface ConnectedDispatchProps {
    readonly submit: () => void;
    readonly setStartSyncAfterTutorial: (event: any, isInputChecked: boolean) => void;
}

export interface ConnectedState {
    readonly startSyncAfterTutorial: boolean
}

type Props = ConnectedDispatchProps & ConnectedState;

const FinalPage: React.StatelessComponent<Props> = (props: Props) =>
    <div>
        <h2>セットアップは以上です！</h2>
        <p>完了を押すとこのウィンドウは閉じられます</p>
        <p>macOSではメニューバー、Windowsではタスクバーに格納されます</p>
        <Checkbox
            checkedIcon={<NotificationSync/>}
            uncheckedIcon={<NotificationSyncDisabled/>}
            checked={props.startSyncAfterTutorial}
            onCheck={props.setStartSyncAfterTutorial}
            label="いますぐGoogle Calendarへの同期を開始する"
        /><br/>
        <RaisedButton
            label="完了"
            primary={true}
            onTouchTap={props.submit}
        />
    </div>;

export default FinalPage;
