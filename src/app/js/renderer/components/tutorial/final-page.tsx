import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import NotificationSync from "@material-ui/icons/Sync";
import NotificationSyncDisabled from "@material-ui/icons/SyncDisabled";
import * as React from "react";
import { Typography } from "../../../../../../node_modules/@material-ui/core";

export interface ConnectedDispatchProps {
    readonly submit: () => void;
    readonly setStartSyncAfterTutorial: (checked: boolean) => void;
}

export interface ConnectedState {
    readonly startSyncAfterTutorial: boolean;
}

type Props = ConnectedDispatchProps & ConnectedState;

const FinalPage: React.StatelessComponent<Props> = (props: Props) => (
    <div>
        <h2>
            <Typography variant="headline">セットアップは以上です！</Typography>
        </h2>
        <Typography>
            <p>完了を押すとこのウィンドウは閉じられます</p>
            <p>macOSではメニューバー、Windowsではタスクバーに格納されます</p>
        </Typography>
        <FormGroup>
            <FormControlLabel
                control={
                    <Checkbox
                        checkedIcon={<NotificationSync />}
                        icon={<NotificationSyncDisabled />}
                        checked={props.startSyncAfterTutorial}
                        onChange={(e, checked) => props.setStartSyncAfterTutorial(checked)}
                    />
                }
                label="いますぐGoogle Calendarへの同期を開始する"
            />
        </FormGroup>
        <br />
        <Button variant="raised" color="primary" onClick={props.submit}>
            完了
        </Button>
    </div>
);

export default FinalPage;
