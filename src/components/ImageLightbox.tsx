import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useLightbox, type LightboxMedia } from '@astryxdesign/core/Lightbox';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import { lightboxImageMaxWidth } from './lightbox-image-fit';
import './image-lightbox.css';

interface Props {
	selector?: string;
}

export default function ImageLightbox({ selector = '.post-content' }: Props) {
	const [media, setMedia] = useState<LightboxMedia[]>([]);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const lightbox = useLightbox({ media, hasZoom: true, className: 'site-lightbox', ref: dialogRef });

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!lightbox.isOpen || !dialog || media.length < 2) return;

		const stage = dialog.querySelector<HTMLElement>('[data-lightbox-page][data-current] [data-lightbox-page-media]');
		const image = stage?.querySelector<HTMLImageElement>('img');
		const controls = [...dialog.querySelectorAll<HTMLElement>(
			'[data-lightbox-chrome]:first-child > span:nth-child(2), [data-lightbox-chrome]:last-child > span:first-child',
		)];
		if (!stage || !image || controls.length !== 2) return;

		const mobile = window.matchMedia('(max-width: 35em), (max-height: 35em) and (pointer: coarse)');
		const updateFit = () => {
			const dialogRect = dialog.getBoundingClientRect();
			const maxWidth = mobile.matches ? null : lightboxImageMaxWidth(
				stage.getBoundingClientRect(),
				dialogRect.left + dialogRect.width / 2,
				image.naturalWidth,
				image.naturalHeight,
				controls.map((control) => control.getBoundingClientRect()),
			);
			image.style.maxWidth = maxWidth === null ? '' : `${maxWidth}px`;
		};
		const observer = new ResizeObserver(updateFit);
		observer.observe(dialog);
		observer.observe(stage);
		controls.forEach((control) => observer.observe(control));
		image.addEventListener('load', updateFit);
		mobile.addEventListener('change', updateFit);
		updateFit();

		return () => {
			observer.disconnect();
			image.removeEventListener('load', updateFit);
			mobile.removeEventListener('change', updateFit);
			image.style.removeProperty('max-width');
		};
	}, [lightbox.isOpen, lightbox.index, media.length]);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!lightbox.isOpen || !dialog || media.length < 2) return;

		const stage = dialog.querySelector<HTMLElement>('[data-lightbox-page][data-current] [data-lightbox-page-media]');
		const image = stage?.querySelector<HTMLImageElement>('img');
		if (!stage || !image) return;

		const updatePosition = () => {
			// Use the fitted image position, not its zoomed or panned bounds.
			const top = stage.getBoundingClientRect().top - dialog.getBoundingClientRect().top
				+ (stage.clientHeight - image.offsetHeight) / 2;
			dialog.style.setProperty('--site-lightbox-image-top', `${top}px`);
		};
		const observer = new ResizeObserver(updatePosition);
		observer.observe(dialog);
		observer.observe(stage);
		observer.observe(image);
		updatePosition();

		return () => {
			observer.disconnect();
			dialog.style.removeProperty('--site-lightbox-image-top');
		};
	}, [lightbox.isOpen, lightbox.index, media.length]);

	useEffect(() => {
		const container = document.querySelector(selector);
		if (!container) return;

		const images = [...container.querySelectorAll<HTMLImageElement>('img')].filter((img) => !img.closest('a'));
		if (images.length === 0) return;

		setMedia(images.map((img) => ({
			src: img.currentSrc || img.src,
			alt: img.alt,
			caption: img.alt || undefined,
		})));

		const cleanups = images.map((img, index) => {
			const triggerProps = lightbox.getTriggerProps(index);
			const previousAttributes = {
				role: img.getAttribute('role'),
				tabindex: img.getAttribute('tabindex'),
				'aria-haspopup': img.getAttribute('aria-haspopup'),
				'aria-label': img.getAttribute('aria-label'),
				cursor: img.style.cursor,
			};
			const onKeyDown = (event: KeyboardEvent) => {
				triggerProps.onKeyDown(event as unknown as ReactKeyboardEvent);
			};

			img.setAttribute('role', triggerProps.role);
			img.tabIndex = triggerProps.tabIndex;
			img.setAttribute('aria-haspopup', triggerProps['aria-haspopup']);
			img.setAttribute('aria-label', img.alt || '画像を拡大表示');
			img.style.cursor = 'zoom-in';
			img.addEventListener('click', triggerProps.onClick);
			img.addEventListener('keydown', onKeyDown);

			return () => {
				img.removeEventListener('click', triggerProps.onClick);
				img.removeEventListener('keydown', onKeyDown);
				for (const [name, value] of Object.entries(previousAttributes)) {
					if (name === 'cursor') {
						img.style.cursor = value ?? '';
					} else if (value === null) {
						img.removeAttribute(name);
					} else {
						img.setAttribute(name, value);
					}
				}
			};
		});

		return () => {
			for (const cleanup of cleanups) cleanup();
		};
	}, [selector, lightbox.getTriggerProps]);

	if (media.length === 0) return null;

	return <Theme theme={neutralTheme}>{lightbox.element}</Theme>;
}
