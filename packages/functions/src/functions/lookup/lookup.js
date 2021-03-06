const {
	excel,
	runFunction,
	sheet: sheetutils,
	terms: { getCellRangeFromTerm, getCellRangesFromTerm }
} = require('../../utils');
const { convert } = require('@cedalo/commons');
const { FunctionErrors } = require('@cedalo/error-codes');
const { SheetIndex, SheetRange } = require('@cedalo/machine-core');

const ERROR = FunctionErrors.code;

const createSheetRange = (start, end, sheet) => {
	const range = SheetRange.fromStartEnd(start, end);
	range.sheet = sheet;
	return range;
};

const term2number = (term, defval) => term ? convert.toNumber(term.value, defval) : defval;
const indexFromOperand = op => 
	// eslint-disable-next-line no-nested-ternary
	op.isTypeOf('CellReference') ? op.index : (op.isTypeOf('CellRangeReference') ? op.value.start : undefined);


//
// == CHOOSE ==
//
const choose = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.mapNextArg((nrTerm) => {
			const nr = term2number(nrTerm, 0);
			return nr > 0 ? nr : ERROR.VALUE;
		})
		.run((nr) => {
			const term = terms[Math.floor(nr)];
			return term != null ? term.value : ERROR.VALUE;
		});

const column = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg(ref => ref ? indexFromOperand(ref.operand) || ERROR.NAME : undefined)
		.run((idx) => {
			idx = idx || sheetutils.cellFromFunc(column);
			return idx ? idx.col + 1 : ERROR.VALUE;
		});
	
//
// == INDEX ==
//
const index = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg((ranges) => {
			ranges = getCellRangesFromTerm(ranges, sheet, true);
			return ranges && ranges.length ? ranges : ERROR.NAME;
		})
		.mapNextArg(rowoffset => convert.toNumber(rowoffset.value, 1) - 1)
		.mapNextArg(coloffset => convert.toNumber(coloffset.value, 1) - 1)
		.mapNextArg(areanr => ((areanr && areanr.value != null) ? convert.toNumber(areanr.value, 1) - 1 : 0))
		.validate((ranges, rowoffset, coloffset, areanr) =>
			FunctionErrors.ifTrue((rowoffset < 0 || coloffset < 0 || areanr < 0), ERROR.VALUE))
		.validate((ranges, rowoffset, coloffset, areanr) => {
			const range = ranges[areanr];
			return FunctionErrors.ifTrue(!range || (rowoffset >= range.height || coloffset >= range.width), ERROR.REF);
		})
		.run((ranges, rowoffset, coloffset, areanr) => {
			let value = '';
			const range = ranges[areanr];
			const targetIdx = range.start.copy();
			if (targetIdx.set(targetIdx.row + rowoffset, targetIdx.col + coloffset)) {
				// get target cell:
				const cell = range.sheet.cellAt(targetIdx);
				value = (cell && cell.isDefined) ? cell.value : value;
				index.term.cellIndex = targetIdx;
			}
			return value;
		});

//
// == MATCH ==
//
const getRelativeIndex = (range, idx) => {
	const start = range.start;
	const col = idx.col - start.col;
	const row = idx.row - start.row;
	return col !== 0 ? col : row;
};
// range must be in ascending order
const findLargest = (range, pivot) => {
	let matchidx = 0;
	if (pivot != null) {
		let lastvalue;
		const type = typeof pivot;
		range.some((cell, idx) => {
			let stop = false;
			const value = cell && cell.value;
			// eslint-disable-next-line valid-typeof
			if (value != null && (typeof value === type)) {
				const isAscending = lastvalue == null || lastvalue < value;
				stop = value > pivot || !isAscending;
				if (!stop) {
					lastvalue = value;
					matchidx = !isAscending ? 0 : getRelativeIndex(range, idx) + 1;
				}
			}
			return stop;
		});
	}
	return matchidx;
};
const findSmallest = (range, pivot) => {
	let matchidx = 0;
	if (pivot != null) {
		let lastvalue;
		const type = typeof pivot;
		range.some((cell, idx) => {
			let stop = false;
			const value = cell && cell.value;
			// eslint-disable-next-line valid-typeof
			if (value != null && (typeof value === type)) {
				const isDescending = lastvalue == null || value < lastvalue;
				stop = value < pivot || !isDescending;
				if (!stop) {
					lastvalue = value;
					matchidx = !isDescending ? 0 : getRelativeIndex(range, idx) + 1;
				}
			}
			return stop;
		});
	}
	return matchidx;
};
// here we support regex!
const findFirstEqual = (range, pivot) => {
	let matchidx = 0;
	if (pivot != null) {
		let relidx = 0;
		const regex = typeof pivot === 'string' ? excel.toExcelRegEx(pivot) : null;
		range.some((cell) => {
			relidx += 1;
			const value = cell && cell.value;
			matchidx = (regex && regex.test(value)) || value === pivot ? relidx : 0;
			return matchidx > 0;
		});
	}
	return matchidx;
};
const isCellRangeFlat = (range) => range.width > 1 ? range.height === 1 : range.height >= 1;
const match = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(2)
		.mapNextArg(pivot => pivot.value)
		.mapNextArg((range) => {
			const cellrange = getCellRangeFromTerm(range, sheet, true);
			// eslint-disable-next-line no-nested-ternary
			return cellrange ? (isCellRangeFlat(cellrange) ? cellrange : ERROR.NA) : ERROR.NAME;
		})
		.run((pivot, range) => {
			const type = term2number(terms[2], 1);
			// eslint-disable-next-line no-nested-ternary
			const findInRange = type < 0 ? findSmallest : (type > 0 ? findLargest : findFirstEqual);
			const idx = findInRange(range, pivot);
			return idx > 0 ? idx : ERROR.NA;
		});


//
// == OFFSET ==
//
const offset = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || ERROR.NAME)
		.mapNextArg(row => term2number(row, ERROR.VALUE))
		.mapNextArg(col => term2number(col, ERROR.VALUE))
		.mapNextArg(height => term2number(height, -1))
		.mapNextArg(width => term2number(width, -1))
		.reduce((range, row, col, height, width) => {
			const cellindex = range.start;
			const startidx = SheetIndex.create(cellindex.row + row, cellindex.col + col);
			const endidx = startidx
				? SheetIndex.create(
					startidx.row + (height < 0 ? range.height : height) - 1,
					startidx.col + (width < 0 ? range.width : width) - 1)
				: null;
			// check new indices (against sheet of function!!):
			const error = FunctionErrors.ifTrue(!startidx
				|| !endidx
				|| !sheet.isValidIndex(startidx)
				|| !sheet.isValidIndex(endidx), ERROR.REF);
			return error || [startidx, endidx];
		})
		.run((startidx, endidx) => {
			// we return a CellRangeReference...
			const offRange = createSheetRange(startidx, endidx, sheet);
			// DL-1425: if range references only one cell we returns its value in cell otherwise an error...
			if (offRange.width === 1 && offRange.height === 1) {
				const cell = offRange.cellAt(offRange.start);
				offset.term.cellValue = cell ? cell.value : 0;
			} else {
				offset.term.cellValue = ERROR.VALUE;
			}
			return offRange;
		});

const row = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMaxArgs(1)
		.mapNextArg(ref => ref ? indexFromOperand(ref.operand) || ERROR.NAME : undefined)
		.run((idx) => {
			idx = idx || sheetutils.cellFromFunc(row);
			return idx ? idx.row : ERROR.VALUE;
		});
//
// == VLOOKUP ==
//
const doLookup = (search, range, exactly) => {
	let lastIndex;
	let lastValue;
	const firstcol = range.start.col;
	const searchType = typeof search;
	range.someByCol((cell, idx) => {
		let stop = idx.col > firstcol;
		if (!stop && cell) {
			const value = cell.value;
			if (value === search) {
				stop = true;
				lastIndex = idx.copy();
				// eslint-disable-next-line
			} else if (!exactly && searchType === typeof value) {
				if (excel.wmatch(convert.toString(value), convert.toString(search))) {
					stop = true;
					lastIndex = idx.copy();
				} else if (value < search) {
					if (lastValue == null || value > lastValue) {
						lastValue = value;
						lastIndex = idx.copy();
					}
				}
			}
		}
		return stop;
	});
	return lastIndex
};
const vlookup = (sheet, ...terms) =>
	runFunction(sheet, terms)
		.withMinArgs(3)
		.withMaxArgs(4)
		.mapNextArg(lookup => lookup.value)
		.mapNextArg(range => getCellRangeFromTerm(range, sheet) || ERROR.NAME)
		.mapNextArg((coloffset) => {
			coloffset = term2number(coloffset, 1);
			return coloffset > 0 ? coloffset - 1 : ERROR.REF;
		})
		.mapNextArg((exactly) => {
			exactly = exactly && convert.toBoolean(exactly.value);
			return exactly != null ? !exactly : false;
		})
		.run((lookup, range, coloffset, exactly) => {
			let cellvalue;
			const idx = doLookup(lookup, range, exactly);
			if (idx) {
				idx.set(idx.row, idx.col + coloffset);
				if (range.contains(idx)) {
					const cell = range.sheet.cellAt(idx);
					cellvalue = cell ? cell.value : '';
				}
			}
			return cellvalue != null ? cellvalue : ERROR.NV;
		});

module.exports = {
	CHOOSE: choose,
	COLUMN: column,
	INDEX: index,
	MATCH: match,
	OFFSET: offset,
	ROW: row,
	VLOOKUP: vlookup
};
