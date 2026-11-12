interface Rect {
	left: number;
	right: number;
	top: number;
	bottom: number;
	width: number;
	height: number;
}

export function lightboxImageMaxWidth(
	stage: Rect,
	centerX: number,
	naturalWidth: number,
	naturalHeight: number,
	controls: Rect[],
): number | null {
	if (!naturalWidth || !naturalHeight || !stage.width || !stage.height || controls.length !== 2) return null;

	const scale = Math.min(1, stage.width / naturalWidth, stage.height / naturalHeight);
	const width = naturalWidth * scale;
	const height = naturalHeight * scale;
	const image = {
		left: centerX - width / 2,
		right: centerX + width / 2,
		top: stage.top + (stage.height - height) / 2,
		bottom: stage.top + (stage.height + height) / 2,
	};
	const overlaps = controls.some((control) =>
		image.left < control.right && image.right > control.left
		&& image.top < control.bottom && image.bottom > control.top
	);
	if (!overlaps) return null;

	const [left, right] = [...controls].sort((a, b) => a.left - b.left);
	const gap = 8;
	return Math.max(0, Math.min(width * 0.8, 2 * (centerX - left.right - gap), 2 * (right.left - centerX - gap)));
}
