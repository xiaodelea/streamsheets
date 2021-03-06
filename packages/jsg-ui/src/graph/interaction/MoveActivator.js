import { default as JSG, TextNode, Shape } from '@cedalo/jsg-core';
import InteractionActivator from './InteractionActivator';
import MoveInteraction from './MoveInteraction';
import GraphController from '../controller/GraphController';
import SelectionHandle from '../view/selection/SelectionHandle';

/**
 * An InteractionActivator used to activate a {{#crossLink "MoveInteraction"}}{{/crossLink}}.
 *
 * @class MoveActivator
 * @extends InteractionActivator
 * @constructor
 */
class MoveActivator extends InteractionActivator {
	constructor() {
		super();
		this._moveThreshold = undefined;
	}

	getKey() {
		return MoveActivator.KEY;
	}

	dispose(viewer) {
		super.dispose(viewer);
		this._moveThreshold = undefined;
	}

	/**
	 * Implemented to be notified about key down events.</br>
	 *
	 * @method onKeyDown
	 * @param {KeyEvent} event The current key event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onKeyDown(event, viewer, dispatcher) {
		switch (event.event.keyCode) {
			case 37:
			case 38:
			case 39:
			case 40: {
				if (!viewer.hasSelection()) {
					return;
				}

				const interaction = this.activateInteraction(new MoveInteraction(), dispatcher);
				interaction.onKeyDown(event, viewer);
				event.hasActivated = true;
				// event.hasConsumed = true; hasConsumed is unknown...
				event.doRepaint = true;
				break;
			}
		}
	}

	/**
	 * Implemented to be notified about mouse down events.</br>
	 *
	 * @method onMouseDown
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDown(event, viewer, dispatcher) {
		this._moveThreshold = viewer
			.getCoordinateSystem()
			.metricToLogXNoZoom(MoveActivator.THRESHOLD);
	}

	/**
	 * Implemented to be notified about mouse drag events.</br>
	 *
	 * @method onMouseDrag
	 * @param {MouseEvent} event The current mouse event.
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @param {InteractionDispatcher} dispatcher The InteractionDispatcher to which this
	 *     activator is registered.
	 */
	onMouseDrag(event, viewer, dispatcher) {
		const thresholdExceeded = this._doExceedThreshold(event, viewer, dispatcher);
		if (!this.isDisposed && thresholdExceeded) {
			// activate if we got a move handle:
			if (this._isMoveHandle(dispatcher.getActiveHandle())) {
				this._activateOnDrag(event, viewer, dispatcher);
			} else {
				// check controller under mouse...
				let controller = viewer.filterFoundControllers(Shape.FindFlags.AUTOMATIC);
				if (controller) {
					const model = controller.getModel();
					if (
						model.getParent() &&
						!(model instanceof TextNode && model.isAssociated()) &&
						model.getParent().isSelectParentFirst()
					) {
						controller = controller.getParent();
					}
				}
				// const controller = dispatcher.getControllerAt(event.location);
				if (this._doMoveWithoutHandle(controller)) {
					if (!controller.isSelected()) {
						viewer.clearSelection();
						viewer.select(controller);
					}
					this._activateOnDrag(event, viewer, dispatcher);
				}
			}
		}
	}

	_doExceedThreshold(event, viewer, dispatcher) {
		const location = JSG.ptCache
			.get()
			.setTo(dispatcher.currentLocation)
			.subtract(dispatcher.startLocation);
		const ext = location.length();
		JSG.ptCache.release(location);
		return ext > this._moveThreshold;
	}

	_isMoveHandle(handle) {
		return handle && handle.getType() === SelectionHandle.TYPE.MOVE;
	}

	_activateOnDrag(event, viewer, dispatcher) {
		const interaction = this.activateInteraction(new MoveInteraction(), dispatcher);
		interaction.onMouseDown(event, viewer);
		interaction.onMouseDrag(event, viewer);
		event.hasActivated = true;
	}

	/**
	 * Called by {{#crossLink "MoveActivator/onMouseDrag:method"}}{{/crossLink}} to check if given
	 * controller should be moved although no move handle is shown.
	 * @method doMoveWithoutHandle
	 * @param {ModelController} controller The controller to check.
	 * @return {Boolean} Returns <code>true</code> if given controller can be moved, <code>false</code> otherwise.
	 * @private
	 */
	_doMoveWithoutHandle(controller) {
		let model;
		let valid = !!controller && !(controller instanceof GraphController);

		if (valid) {
			model = controller.getModel();
			valid = model.isMoveable();
		}
		return valid;
	}
	/**
	 * Threshold which is used to activate {{#crossLink "MoveInteraction"}}{{/crossLink}} when
	 * handling {{#crossLink "MoveActivator/onMouseDrag:method"}}{{/crossLink}}.
	 *
	 * @property THRESHOLD
	 * @type {Number}
	 * @static
	 */
	static get THRESHOLD() {
		return 50;
	}

	/**
	 * The unique key under which this activator is registered to {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}}.
	 *
	 * @property KEY
	 * @type {String}
	 * @static
	 */
	static get KEY() {
		return 'move.activator';
	}
}


export default MoveActivator;
