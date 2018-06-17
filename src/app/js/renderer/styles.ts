import { createStyles, Theme, withStyles } from "@material-ui/core/styles";

export const styles = ({ spacing }: Theme) =>
    createStyles({
        textField: {
            width: 256,
            margin: 8,
        },
        button: {
            margin: 12,
        },
        formControl: {
            margin: spacing.unit,
            minWidth: 180,
        },
    });
