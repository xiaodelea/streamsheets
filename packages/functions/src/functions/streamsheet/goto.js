const { runFunction } = require('../../utils');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

// maybe renamed to continue...
const goto = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.onSheetCalculation()
		.withArgCount(1)
		.mapNextArg(term => term.operand)
		.addMappedArg((operand) => {
			const index = operand.index;
			return index != null ? index : ERROR.INVALID_PARAM;
		})
		.run((oprand, index) => {
			sheet.processor.goto(index);
			return true;
		});


module.exports = goto;
