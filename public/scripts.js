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

		const title = document.createElement('h2');
		title.textContent = section.title;
		section_div.appendChild(title);

		if (section.items && section.items.length > 0) {
			for (const item of section.items) {
				const item_div = document.createElement('div');
				item_div.innerHTML = `<strong>${item.name}</strong>: <code>${item.notation}</code>`;
				section_div.appendChild(item_div);
			}
		}

		main_element.appendChild(section_div);
	}
}

main();
