function generate_cube_svg(size, position, arrows = null) {
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
	let svg_html = `<svg viewBox="-1 -1 ${padded_size} ${padded_size}" width="${padded_size}" height="${padded_size}" style="display: inline-block; margin-right: 8px; margin-bottom: 8px;">`;

	svg_html += `
		<defs>
			<marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
				<polygon points="0,0 4,2 0,4" fill="black" />
			</marker>
			<marker id="arrowhead_start" markerWidth="4" markerHeight="4" refX="1" refY="2" orient="auto">
				<polygon points="4,0 0,2 4,4" fill="black" />
			</marker>
		</defs>
	`;

	position.forEach((row, ri) => {
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

	if (arrows) {
		arrows.forEach(arrow => {
			const x1 = outer_width + arrow.from[0] * cell_size + cell_size / 2;
			const y1 = outer_width + arrow.from[1] * cell_size + cell_size / 2;
			const x2 = outer_width + arrow.to[0] * cell_size + cell_size / 2;
			const y2 = outer_width + arrow.to[1] * cell_size + cell_size / 2;

			const marker_start = arrow.both_ways ? 'marker-start="url(#arrowhead_start)"' : '';
			const marker_end = 'marker-end="url(#arrowhead)"';

			svg_html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="2" ${marker_start} ${marker_end} />`;
		});
	}

	svg_html += `</svg>`;
	return svg_html;
}

async function main() {
	const response = await fetch('config.jsonc');
	const text = await response.text();

	// Remove single-line comments from jsonc before parsing
	const clean_json = text.replace(/\/\/.*/g, '');
	const config = JSON.parse(clean_json);

	const main_element = document.querySelector('main');
	main_element.innerHTML = '';

	const resolved_cube_div = document.createElement('div');
	resolved_cube_div.style.display = 'flex';
	resolved_cube_div.style.justifyContent = 'center';
	resolved_cube_div.style.marginBottom = '2rem';

	const img = document.createElement('img');
	img.src = 'icon.svg';
	img.alt = "Resolved Rubik's Cube";
	img.width = 160;
	img.height = 160;

	resolved_cube_div.appendChild(img);
	main_element.appendChild(resolved_cube_div);

	for (const section of config) {
		const section_div = document.createElement('section');

		const title = document.createElement('h1');
		title.textContent = section.title;
		section_div.appendChild(title);

		if (section.items && section.items.length > 0) {
			for (const item of section.items) {
				const item_div = document.createElement('div');

				let svg_html = '';
				if (item.start_positions && item.size) {
					for (const position of item.start_positions) {
						svg_html += generate_cube_svg(item.size, position, item.arrows);
					}
				}

				item_div.innerHTML = `${svg_html}<strong>${item.name}</strong>: <code>${item.notation}</code>`;
				section_div.appendChild(item_div);
			}
		}

		main_element.appendChild(section_div);
	}
}

main();
