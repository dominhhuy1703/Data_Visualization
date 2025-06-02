// const scale_d3 = {'ordinal': d3.scaleOrdinal}

//function to convert rgb object to hex color
function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
	// Remove the "#" character if present
	hex = hex.replace(/^#/, '');

	// Convert from short form (3 characters) to full form (6 characters)
	if (hex.length === 3) {
		hex = hex.split('').map(c => c + c).join('');
	}

	// Convert to RGB values
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	return `rgb(${r}, ${g}, ${b})`;
}

// Function to truncate long labels
function truncateLabel(label, maxLength = 5) {
	return label.length > maxLength ? label.slice(0, maxLength) + "..." : label;
}

function parseD3ColorScheme(input) {
	const regex = /^([a-zA-Z0-9]+)(?:\[(\d+)\])?$/;
	const match = input.match(regex);

	if (!match) return null;

	const rawName = match[1];
	const index = match[2] ? parseInt(match[2], 10) : null;

	const getCorrectD3Name = (inputName) => {
		const d3Keys = Object.keys(d3);
		const lowerInput = inputName.toLowerCase();
		const found = d3Keys.find(key => {
			if (key.startsWith("scheme") || key.startsWith("interpolate")) {
				const cleanKey = key.replace(/^scheme|^interpolate/, '').toLowerCase();
				return cleanKey === lowerInput;
			}
			return false;
		});
		if (found) {
			return found.replace(/^scheme|^interpolate/, '');
		}
		return inputName; // fallback if can't find
	};

	const correctedName = getCorrectD3Name(rawName);
	const fullInterpolate = `interpolate${correctedName}`;
	const fullScheme = `scheme${correctedName}`;

	// Check index, use d3.scheme with index (Ex: d3.schemeReds[5])
	if (index !== null && fullScheme in d3) {
		const scheme = d3[fullScheme];
		if (Array.isArray(scheme)) {
			// Check scheme[index] is exist
			const schemeWithIndex = scheme[index];
			if (Array.isArray(schemeWithIndex)) {
				return {
					type: "scheme",
					value: schemeWithIndex,
					raw: rawName,
				};
			}
		} else if (typeof scheme === "object") {
			return {
				type: "scheme",
				value: scheme[index] || null,
				raw: rawName,
			};
		}
	}

	// If index is not exist, use interpolate (Ex: d3.interpolateReds)
	if (fullInterpolate in d3 && typeof d3[fullInterpolate] === "function") {
		return {
			type: "interpolate",
			value: d3[fullInterpolate],
			raw: rawName,
		};
	}

	// If it's not interpolate but a scheme attached to an index (Ex: d3.schemeCategory10)
	if (fullScheme in d3) {
		const scheme = d3[fullScheme];
		if (Array.isArray(scheme)) {
			return {
				type: "scheme",
				value: scheme,
				raw: rawName,
			};
		}
	}
	console.warn(`D3 doesn't have ${fullScheme} or ${fullInterpolate}`);
	return null;
}

function toSuperscript(num) {
	const superscripts = {
		"0": "⁰",
		"1": "¹",
		"2": "²",
		"3": "³",
		"4": "⁴",
		"5": "⁵",
		"6": "⁶",
		"7": "⁷",
		"8": "⁸",
		"9": "⁹",
		".": ".", 
		"-": "⁻"   
	};
	return String(num)
		.split("")
		.map(c => superscripts[c] || c) 
		.join("");
}
