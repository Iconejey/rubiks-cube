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

function html(strings, ...values) {
	return strings.reduce((result, string, i) => {
		const value = values[i] !== undefined ? values[i] : '';
		return result + string + value;
	}, '');
}

function generate_move_card(size, move_str, moves_config) {
	let inverted = false;
	let base_move = move_str;
	if (base_move.endsWith("'")) {
		inverted = true;
		base_move = base_move.slice(0, -1);
	}
	let repeat = 1;
	if (base_move.endsWith('2')) {
		repeat = 2; // handled by text
		base_move = base_move.slice(0, -1);
	}

	const move_def = moves_config[size] && moves_config[size][base_move];
	if (!move_def) {
		return `<span class="move-card unknown">${move_str}</span>`;
	}

	const cell_size = 15;
	const svg_size = size * cell_size;

	let svg_transform = '';
	if (move_def.circle) {
		svg_transform = inverted ? 'transform: rotate(-10deg);' : 'transform: rotate(10deg);';
	}

	const padded_size = svg_size + 2;
	let svg_html = `<svg viewBox="-1 -1 ${padded_size} ${padded_size}" width="${padded_size}" height="${padded_size}" style="display: block; margin-bottom: 2px; ${svg_transform}">
		<defs>
			<marker id="mc_arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
				<polygon points="0,0 4,2 0,4" fill="black" />
			</marker>
		</defs>
	`;

	// draw grid
	svg_html += `<g fill="none" stroke="black" stroke-width="1" opacity="0.2">`;
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			svg_html += `<rect x="${c * cell_size}" y="${r * cell_size}" width="${cell_size}" height="${cell_size}" />`;
		}
	}
	svg_html += `</g>`;

	if (move_def.circle) {
		const r = svg_size * 0.35;
		const cx = svg_size / 2;
		const cy = svg_size / 2;

		const startX = cx;
		const startY = cy - r;

		if (inverted) {
			// Counter-clockwise 3/4 turn ends at Right
			const endX = cx + r;
			const endY = cy;
			svg_html += `<path d="M ${startX} ${startY} A ${r} ${r} 0 1 0 ${endX} ${endY}" fill="none" stroke="black" stroke-width="2" />`;
			// Arrow pointing UP
			svg_html += `<polygon points="${endX},${endY} ${endX - 3},${endY + 5} ${endX + 3},${endY + 5}" fill="black" />`;
		} else {
			// Clockwise 3/4 turn ends at Left
			const endX = cx - r;
			const endY = cy;
			svg_html += `<path d="M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}" fill="none" stroke="black" stroke-width="2" />`;
			// Arrow pointing UP
			svg_html += `<polygon points="${endX},${endY} ${endX - 3},${endY + 5} ${endX + 3},${endY + 5}" fill="black" />`;
		}
	} else if (move_def.arrows) {
		move_def.arrows.forEach(arrow => {
			let from = arrow.from;
			let to = arrow.to;
			if (inverted) {
				from = arrow.to;
				to = arrow.from;
			}
			const x1 = from[0] * cell_size + cell_size / 2;
			const y1 = from[1] * cell_size + cell_size / 2;
			const x2 = to[0] * cell_size + cell_size / 2;
			const y2 = to[1] * cell_size + cell_size / 2;
			svg_html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="2" marker-end="url(#mc_arrow)" />`;
		});
	}
	svg_html += `</svg>`;

	return `<div class="move-card" style="background-color: ${move_def.color}99;">
			${svg_html}
			<div class="move-label">${move_str}</div>
		</div>`;
}

async function main() {
	const [config_res, moves_res] = await Promise.all([fetch('config.jsonc'), fetch('moves.json')]);
	const [text, moves_config] = await Promise.all([config_res.text(), moves_res.json()]);

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
				item_div.classList.add('item');

				let svg_html = '';
				if (item.start_positions && item.size) {
					for (const position of item.start_positions) {
						svg_html += generate_cube_svg(item.size, position, item.arrows);
					}
				}

				item_div.innerHTML = html`
					<h2>${item.name}</h2>
					<div class="start-positions">${svg_html}</div>
					<div class="notation">
						${item.notation
							.split(' ')
							.map(move => generate_move_card(item.size, move, moves_config))
							.join('')}
					</div>
				`;

				section_div.appendChild(item_div);
			}
		}

		main_element.appendChild(section_div);
	}
}

main();
