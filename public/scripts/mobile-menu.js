const menus = [...document.querySelectorAll('details.menu-dropdown')];

document.addEventListener('pointerdown', (event) => {
	for (const menu of menus) {
		if (!menu.contains(event.target)) menu.open = false;
	}
});

for (const menu of menus) {
	menu.addEventListener('toggle', () => {
		if (!menu.open) return;
		for (const other of menus) {
			if (other !== menu) other.open = false;
		}
	});

	menu.addEventListener('click', (event) => {
		if (event.target.closest('.dropdown-item')) menu.open = false;
	});

	menu.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && menu.open) {
			event.preventDefault();
			menu.open = false;
			menu.querySelector('summary').focus();
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			const links = [...menu.querySelectorAll('.dropdown-item')];
			if (!links.length) return;
			event.preventDefault();
			menu.open = true;
			const current = links.indexOf(document.activeElement);
			const next = current === -1
				? (event.key === 'ArrowDown' ? 0 : links.length - 1)
				: (current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
			links[next].focus();
		}
	});
}
