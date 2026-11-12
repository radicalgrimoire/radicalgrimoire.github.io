/** Markdown 本文に画像(Markdown 記法または HTML の img)が含まれるか判定する。 */
export function hasContentImages(body: string | undefined): boolean {
	return body !== undefined && (/!\[[^\]]*\]\(/.test(body) || /<img[\s/>]/i.test(body));
}
