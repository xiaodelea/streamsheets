import { default as JSG, TextNode, ItemAttributes } from '@cedalo/jsg-core';
import Interaction from './Interaction';
import ConnectionController from '../controller/ConnectionController';
import ContentNodeController from '../controller/ContentNodeController';
import MarqueeFeedbackView from '../view/MarqueeFeedbackView';
import Cursor from '../../ui/Cursor';

/**
 * An interaction subclass that handles the selection of one or several {{#crossLink
 * "GraphItem"}}{{/crossLink}}s. This is done by spanning a rectangle area over all items which should
 * be selected.
 *
 * @class MarqueeInteraction
 * @extends Interaction
 * @constructor
 */
class MarqueeInteraction extends Interaction {
	constructor() {
		super();
		// the feedback rectangle:
		this._feedbackRect = undefined;
	}

	deactivate(viewer) {
		viewer.removeInteractionFeedback(this._feedbackRect);
		this._feedbackRect = undefined;
		super.deactivate(viewer);
	}

	onMouseDrag(event, viewer) {
		// show and update feedback rectangle...
		const tmppoint = JSG.ptCache.get();
		tmppoint.setTo(event.location);
		viewer.translateFromParent(tmppoint);
		const feedback = this._getFeedbackRect(viewer);
		feedback.setBounds(
			Math.min(this.startLocation.x, tmppoint.x),
			Math.min(this.startLocation.y, tmppoint.y),
			Math.abs(tmppoint.x - this.startLocation.x),
			Math.abs(tmppoint.y - this.startLocation.y)
		);
		JSG.ptCache.release(tmppoint);
	}

	/**
	 * Creates, if necessary, and returns the view to use as interaction feedback.
	 *
	 * @method _getFeedbackRect
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @return {MarqueeFeedbackView} The feedback view.
	 * @private
	 */
	_getFeedbackRect(viewer) {
		if (!this._feedbackRect) {
			viewer.clearInteractionFeedback();
			this._feedbackRect = new MarqueeFeedbackView();
			viewer.addInteractionFeedback(this._feedbackRect);
		}
		return this._feedbackRect;
	}

	willFinish(event, viewer, offset) {
		if (this._feedbackRect) {
			this._doSelect(viewer);
		}
	}

	/**
	 * Performs the actual selection of {{#crossLink "GraphItem"}}{{/crossLink}}s. This will select all
	 * items which are completely within the bounds of current feedback view.
	 *
	 * @method _doSelect
	 * @param {ControllerViewer} viewer The ControllerViewer used by InteractionHandler.
	 * @private
	 */
	_doSelect(viewer) {
		const selection = [];
		const tmppoint = JSG.ptCache.get();
		const tmpbbox = JSG.boxCache.get();
		const selectRect = this._feedbackRect.getBounds(JSG.rectCache.get());
		const root = viewer.getRootController().getContent();
		const graphView = viewer.getGraphView();
		const graph = graphView.getItem();

		function isLineSelected(line) {
			// check if all line points are covered by selection rectangle:
			let i;
			let n;

			const points = line.getTranslatedShapePoints(graph);
			let isSelected = points.length !== 0;
			for (i = 0, n = points.length; i < n && isSelected; i += 1) {
				isSelected = selectRect.containsPoint(points[i]);
			}
			return isSelected;
		}

		const checkSelection = (controller) => {
			const model = controller.getModel();
			const isPart = model.getItemAttribute(ItemAttributes.ITEMPART).getValue();
			if (controller === root) {
				return true; // go down...
			}
			if (
				!isPart &&
				controller instanceof ConnectionController &&
				model.isSelectable() &&
				isLineSelected(model)
			) {
				// we don't use bbox for lines!!
				selection.push(controller);
				return false; // do not select children in addition
			}
			// check bbox...
			const view = controller.getView();
			const bbox = view.getTranslatedBoundingBox(graphView, tmpbbox);
			if (
				!isPart &&
				!(model instanceof TextNode && model.isAssociated()) &&
				model.isSelectable() &&
				selectRect.containsBBox(bbox)
			) {
				selection.push(controller);
				return false; // do not select children in addition
			}

			// don't traverse ContentNodeController
			return !(controller instanceof ContentNodeController);
		};
		root.traverse(checkSelection);
		viewer.setSelection(selection);
		JSG.ptCache.release(tmppoint);
		JSG.boxCache.release(tmpbbox);
		JSG.rectCache.release(selectRect);
	}

	onMouseExit(event, viewer) {
		this.cancelInteraction(event, viewer);
	}

	cancelInteraction(event, viewer) {
		if (event) {
			event.doRepaint = true;
		}
		this.setCursor(Cursor.Style.AUTO);
		super.cancelInteraction(event, viewer);
	}
}

export default MarqueeInteraction;
