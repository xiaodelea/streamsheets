const bar = require('./bar');
const help = require('./help');
const { Functions } = require('@cedalo/parser');

const {
	ATTRIBUTES,
	CLASSIFYPOINT,
	EVENTS,
	FILLLINEARGRADIENT,
	FILLPATTERN,
	FILLRADIALGRADIENT,
	FONTFORMAT,
	LINEFORMAT,
	ONCLICK,
	ONDOUBLECLICK,
	ONMOUSEDOWN,
	ONMOUSEUP,
	ONVALUECHANGE,
	QRCODE
} = Functions;

module.exports = {
	help,
	functions: {
		ATTRIBUTES,
		BAR: bar,
		CLASSIFYPOINT,
		'DRAW.BUTTON': Functions['DRAW.BUTTON'],
		'DRAW.CHART': Functions['DRAW.CHART'],
		'DRAW.CHECKBOX': Functions['DRAW.CHECKBOX'],
		'DRAW.ELLIPSE': Functions['DRAW.ELLIPSE'],
		'DRAW.LABEL': Functions['DRAW.LABEL'],
		'DRAW.LINE': Functions['DRAW.LINE'],
		'DRAW.KNOB': Functions['DRAW.KNOB'],
		'DRAW.POLYGON': Functions['DRAW.POLYGON'],
		'DRAW.RECTANGLE': Functions['DRAW.RECTANGLE'],
		'DRAW.SLIDER': Functions['DRAW.SLIDER'],
		EVENTS,
		FILLLINEARGRADIENT,
		FILLPATTERN,
		FILLRADIALGRADIENT,
		FONTFORMAT,
		LINEFORMAT,
		ONCLICK,
		ONDOUBLECLICK,
		ONMOUSEDOWN,
		ONMOUSEUP,
		ONVALUECHANGE,
		QRCODE
	}
};
