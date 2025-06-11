// const scale_d3 = {'ordinal': d3.scaleOrdinal}
// import * as d3 from 'd3';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

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
function createColorScale({ domain, range, dataKeys, fallbackInterpolator = d3.interpolateTurbo, label = "Color" }) {
	const isDomainArray = Array.isArray(domain) && domain.length > 0;

	if (isDomainArray) {
		const duplicates = domain.filter((item, index) => domain.indexOf(item) !== index);
		if (duplicates.length > 0) {
			console.warn(`[${label} Warning] Duplicate domain values: ${[...new Set(duplicates)].join(', ')}`);
		}
	}

	let finalDomain;
	if (isDomainArray) {
		const validDomain = domain.filter(d => dataKeys.includes(d));
		const extraDomain = domain.filter(d => !dataKeys.includes(d));
		const missingDomain = dataKeys.filter(d => !validDomain.includes(d));
		if (extraDomain.length > 0) {
			console.warn(`[${label} Warning] Extra domain values not in data: ${extraDomain.join(', ')}`);
		}
		if (missingDomain.length > 0) {
			console.warn(`[${label} Warning] Missing domain values from data: ${missingDomain.join(', ')}`);
		}
		missingDomain.sort((a, b) => a.localeCompare(b));
		finalDomain = [...validDomain, ...missingDomain];
	} else {
		console.warn(`[${label} Warning] Invalid or empty domain. Using dataset values.`);
		finalDomain = [...dataKeys].sort((a, b) => a.localeCompare(b));
	}

	let finalRange = range;
	if (typeof range === 'string') {
		const parsed = parseD3ColorScheme(range);
		if (parsed?.type === "interpolate") {
			finalRange = d3.quantize(parsed.value, finalDomain.length);
		} else if (parsed?.type === "scheme") {
			finalRange = parsed.value;
		}
	}

	if (!Array.isArray(finalRange) || finalRange.length === 0) {
		console.warn(`[${label} Warning] Invalid color range. Using default interpolator.`);
		finalRange = d3.quantize(t => fallbackInterpolator(t), finalDomain.length);
	}

	if (finalRange.length < finalDomain.length) {
		console.warn(`[${label} Warning] Color range (${finalRange.length}) < domain (${finalDomain.length}). Colors will repeat.`);
	} else if (finalRange.length > finalDomain.length) {
		console.warn(`[${label} Warning] Color range (${finalRange.length}) > domain (${finalDomain.length}). Extra colors ignored.`);
	}

	const finalColors = finalDomain.map((_, i) => finalRange[i % finalRange.length]);

	return {
		scale: d3.scaleOrdinal().domain(finalDomain).range(finalColors),
		domain: finalDomain,
		range: finalRange
	};
}

function renderColorPickers(container, domain, colorScale, colorVariable, onChangeCallback) {
	container.innerHTML = "";
	domain.forEach((d, index) => {
		const colorItem = document.createElement("div");
		colorItem.classList.add("color-item");

		const label = document.createElement("label");
		label.textContent = d;

		const input = document.createElement("input");
		input.type = "color";
		input.value = d3.color(colorScale(d)).formatHex();
		input.setAttribute("data-index", index);

		colorItem.appendChild(input);
		colorItem.appendChild(label);
		container.appendChild(colorItem);

		input.addEventListener("input", (event) => onChangeCallback(event, colorVariable, d));
	});
}

function getAllIndexes(array, value) {
	const indexes = [];
	let i = -1;
	while ((i = array.indexOf(value, i + 1)) !== -1) {
		indexes.push(i);
	}
	return indexes;
}

function updateColor(event, colorVariable, label, data, rects) {
	const listColorCriteria = data.map(d => d[colorVariable]);
	const indexes = getAllIndexes(listColorCriteria, label);
	for (const index of indexes) {
		const newColor = event.target.value;
		data[index].color = newColor;
		const rect = rects[index];
		d3.select(rect)
			.transition()
			.duration(300)
			.attr("fill", newColor);
	}
	return data;
}

export {
	componentToHex,
	rgbToHex,
	hexToRgb,
	parseD3ColorScheme,
	createColorScale,
	renderColorPickers,
	updateColor,
	getAllIndexes
};