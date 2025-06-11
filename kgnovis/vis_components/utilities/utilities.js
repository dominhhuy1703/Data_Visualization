function dataParser(newValue) {
	try {
		const parsed = JSON.parse(newValue);
		const rawData = Array.isArray(parsed) ? parsed : parsed.values || parsed;

		return rawData.map(d => {
			const flat = {};
			for (const [k, v] of Object.entries(d)) {
				flat[k] = v?.value !== undefined
					? (isNaN(+v.value) ? v.value : +v.value)
					: v;
			}
			return flat;
		});
	} catch (e) {
		console.error("Invalid data attribute", e);
		return null;
	}
}

function encodingParser(newValue) {
	const parsed = JSON.parse(newValue);

		const flatten = (obj) => {
			const result = {};
			for (const [key, val] of Object.entries(obj)) {
				if (val && typeof val === 'object') {
					result[key] = {};
					for (const [k, v] of Object.entries(val)) {
						result[key][k] = v?.value !== undefined
							? (isNaN(+v.value) ? v.value : +v.value)
							: v;
					}
				} else {
					result[key] = val;
				}
			}
			return result;
		};

		return flatten(parsed);
}

export {
    dataParser,
    encodingParser,
};