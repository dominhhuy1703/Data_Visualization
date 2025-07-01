function dataParser(newValue) {
	try {
		// Nếu là chuỗi thì parse, nếu là object rồi thì giữ nguyên
		const parsed = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;

		const normalize = (arr) => arr.map(d => {
			const flat = {};
			for (const [k, v] of Object.entries(d)) {
				flat[k] = v?.value !== undefined
					? (isNaN(+v.value) ? v.value : +v.value)
					: v;
			}
			return flat;
		});

		// SPARQL case: get bindings from parsed.results
		if (parsed?.results?.bindings && Array.isArray(parsed.results.bindings)) {
			return normalize(parsed.results.bindings);
		}

		// Other fallback cases (optional, may not be needed)
		if (Array.isArray(parsed)) {
			return normalize(parsed);
		}

		if (parsed.values && Array.isArray(parsed.values)) {
			return normalize(parsed.values);
		}

		if (typeof parsed === 'object') {
			return normalize([parsed]);
		}

		console.warn("Unrecognized data format", parsed);
		return [];
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