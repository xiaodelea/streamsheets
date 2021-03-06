const { runFunction, terms: { getCellRangeFromTerm } } = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');

const ERROR = FunctionErrors.code;

const rangeSum = range => range.reduce((sum, cell) => {
	if (cell != null) sum += convert.toNumberStrict(cell.value, 0);
	return sum;
}, 0);

const sumOf = (sheet, terms) => {
	let error;
	return terms.reduce((total, term) => {
		// range or value:
		if (!error) {
			const range = getCellRangeFromTerm(term, sheet);
			const nr = !range ? convert.toNumber(term.value, ERROR.VALUE) : undefined;
			error = FunctionErrors.isError(range) || FunctionErrors.isError(nr) || FunctionErrors.isError(term.value);
			if (!error) total += range ? rangeSum(range) : nr;
		}
		return error || total;
	}, 0);
};

const sum = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(1)
		.run(() => sumOf(sheet, terms));

module.exports = sum;
