async function main() {
	const response = await fetch('config.jsonc');
	const text = await response.text();

	// Remove single-line comments from jsonc before parsing
	const clean_json = text.replace(/\/\/.*/g, '');
	const config = JSON.parse(clean_json);

	const main_element = document.querySelector('main');
	main_element.innerHTML = '';

	for (const section of config) {
		const section_div = document.createElement('section');

		const title = document.createElement('h1');
		title.textContent = section.title;
		section_div.appendChild(title);

		if (section.items && section.items.length > 0) {
			for (const item of section.items) {
				const item_div = document.createElement('div');

				let svg_html = '';
				if (item.start_position && item.size) {
					const size = item.size;
					const cell_size = 20;
					const outer_width = cell_size / 2;
					const svg_size = size * cell_size + 2 * outer_width;

					const get_vertex = (c, r) => {
						let x = c === 0 ? 0 : c === size + 2 ? svg_size : outer_width + (c - 1) * cell_size;
						let y = r === 0 ? 0 : r === size + 2 ? svg_size : outer_width + (r - 1) * cell_size;

						const cx = svg_size / 2;
						const cy = svg_size / 2;
						const squeeze = 0.15;

						if (r === 0 || r === size + 2) {
							x += (cx - x) * squeeze;
						}
						if (c === 0 || c === size + 2) {
							y += (cy - y) * squeeze;
						}
						return `${x},${y}`;
					};

					const padded_size = svg_size + 2;
					svg_html = `<svg viewBox="-1 -1 ${padded_size} ${padded_size}" width="${padded_size}" height="${padded_size}" style="display: block; margin-bottom: 8px;">`;
					item.start_position.forEach((row, ri) => {
						for (let ci = 0; ci < row.length; ci++) {
							const char = row[ci];
							if (char !== ' ') {
								const color = char === '#' ? 'var(--gray)' : `var(--${char})`;
								const p1 = get_vertex(ci, ri);
								const p2 = get_vertex(ci + 1, ri);
								const p3 = get_vertex(ci + 1, ri + 1);
								const p4 = get_vertex(ci, ri + 1);
								svg_html += `<polygon points="${p1} ${p2} ${p3} ${p4}" fill="${color}" stroke="black" stroke-width="2" stroke-linejoin="round" />`;
							}
						}
					});
					svg_html += `</svg>`;
				}

				item_div.innerHTML = `${svg_html}<strong>${item.name}</strong>: <code>${item.notation}</code>`;
				section_div.appendChild(item_div);
			}
		}

		main_element.appendChild(section_div);
	}
}

main();
