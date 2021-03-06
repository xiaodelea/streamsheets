/* eslint-disable react/forbid-prop-types */
import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import Button from '@material-ui/core/Button';
import { connect } from 'react-redux';
// import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { FormattedMessage } from 'react-intl';

import JSG from '@cedalo/jsg-ui';

import { graphManager } from '../../GraphManager';
import * as Actions from '../../actions/actions';

const styles = {
	radioButton: {
		marginBottom: 10,
	},
};

/**
 * A modal dialog can only be closed by selecting one of the actions.
 */
export class InsertCellsDialog extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			open: false,
			type: 'cellshorizontal',
		};

		this.handleClose = this.handleClose.bind(this);
	}

	componentDidMount() {
		JSG.NotificationCenter.getInstance().register(
			this,
			JSG.WorksheetView.SHEET_ACTION_NOTIFICATION, 'onSheetAction',
		);
	}

	componentWillUnmount() {
		JSG.NotificationCenter.getInstance().unregister(
			this,
			JSG.WorksheetView.SHEET_ACTION_NOTIFICATION,
		);
	}

	onSheetAction(notification) {
		if (notification.object) {
			// const item = notification.object.view.getItem();
			if (notification.object.action === 'insertcells') {
				this.setState({ open: true });
			}
		}
	}

	handleCancel = () => {
		this.setState({ open: false });
	};

	handleClose = () => {
		this.setState({ open: false });

		const sheetView = graphManager.getActiveSheetView();

		if (sheetView) {
			sheetView.insertCells(graphManager.getGraphEditor().getGraphViewer(), this.state.type);
		}
	};

	render() {
		return (
			<div>
				<Dialog
					open={this.state.open}
				>
					<DialogTitle>
						<FormattedMessage
							id="InsertCellsDialog"
							defaultMessage="Insert Cells"
						/>
					</DialogTitle>
					<DialogContent>
						<RadioGroup
							name="type"
							value={this.state.type}
							onChange={(event, state) => { this.setState({ type: state }); }}
							style={{
								marginTop: '20px',
							}}
						>
							<FormControlLabel
								value="cellshorizontal"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage
									id="InsertCellsDialog.moveRight"
									defaultMessage="Move Right"
								/>}
							/>
							<FormControlLabel
								value="cellsvertical"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage
									id="InsertCellsDialog.moveBottom"
									defaultMessage="Move Bottom"
								/>}
							/>
							<FormControlLabel
								value="rows"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage
									id="InsertCellsDialog.insertRows"
									defaultMessage="Insert Rows"
								/>}
							/>
							<FormControlLabel
								value="columns"
								style={styles.radioButton}
								control={<Radio />}
								label={<FormattedMessage
									id="InsertCellsDialog.insertColumns"
									defaultMessage="Insert Columns"
								/>}
							/>
						</RadioGroup>
					</DialogContent>
					<DialogActions>
						<Button
							color="primary"
							onClick={this.handleCancel}
						>
							<FormattedMessage
								id="Cancel"
								defaultMessage="Cancel"
							/>
						</Button>
						<Button
							color="primary"
							autoFocus
							onClick={this.handleClose}
						>
							<FormattedMessage
								id="OK"
								defaultMessage="OK"
							/>
						</Button>
					</DialogActions>
				</Dialog>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		appState: state.appState,
	};
}
function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(InsertCellsDialog);
