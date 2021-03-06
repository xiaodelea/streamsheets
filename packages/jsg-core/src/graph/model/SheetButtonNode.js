const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const Attribute = require('../attr/Attribute');
const StringAttribute = require('../attr/StringAttribute');
const CellRange = require('./CellRange');

module.exports = class SheetButtonNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineCorner(150);
		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#DDDDDD');
		this.getTextFormat().setFontSize(9);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);
		this.addAttribute(new StringAttribute('title', 'Button'));
		this.addAttribute(new Attribute('value', false));

		this.showFeedback = true;
	}

	newInstance() {
		return new SheetButtonNode();
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		return copy;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'sheetbuttonnode');
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Button');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	getValue() {
		let value = this.getAttributeValueAtPath('value');
		if (value === undefined) {
			return false;
		}

		if (value === 0 || value === '0' || value === false) {
			return false;
		}
		if (value === 1 || value === '1' || value === true) {
			return true;
		}

		const sheet = this.getSheet();
		if (sheet && typeof value === 'string') {
			const range = CellRange.parse(value, sheet);
			if (range) {
				range.shiftFromSheet();
				const cell = sheet.getDataProvider().getRC(range.getX1(), range.getY1());
				if (cell) {
					value = cell.getValue();
					return !(value === 0 || value === '0' || value === false);
				}
			}
		}

		return false;
	}

	isMoveable() {
		if (
			this.getGraph()
				.getMachineContainer()
				.getMachineState()
				.getValue() === 0
		) {
			return false;
		}

		return super.isMoveable();
	}

	isAddLabelAllowed() {
		return false;
	}
};
