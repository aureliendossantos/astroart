import { IGDBtoWorkInsert } from "$lib/igdb"
import { TMDBtoWorkInsert } from "$lib/tmdb"
import { Work, and, db, eq } from "astro:db"
import slugify from "slugify"

export type WorkInsert = typeof Work.$inferInsert

export const createWork = async (type: string, data: any) => {
	const workInsert = await sourceToWorkInsert(type, data)
	return await db.insert(Work).values(workInsert).returning()
}

const sourceToWorkInsert = async (type: string, data: any) => {
	switch (type) {
		case "VideoGame":
			return await IGDBtoWorkInsert(data)
		case "Movie":
			return await TMDBtoWorkInsert(data)
		default:
			throw new Error(`Unknown work type: ${type}`)
	}
}

/**
 * Creates a unique slug for a new work.
 * Tries `title-year`, then `title-author-year`, then `title-author-year-2`, etc.
 * If no year is given, tries `title-author`, then `title-author-2`, etc.
 * @param shortTitle the English title of the work, without subtitles.
 * @param author the last name of the author, eg. "Bergman".
 * @returns the slug.
 */
export const createWorkSlug = async (
	type: string,
	shortTitle: string,
	author: string,
	year?: number
) => {
	const regex = /[*+~.()'"!:@«»]/g
	const t = slugify(shortTitle, { remove: regex, lower: true })
	const a = slugify(author, { remove: regex, lower: true })
	const y = year && year.toString().length == 4 ? year : undefined
	const shortSlug = y ? `${t}-${y}` : `${t}-${a}`
	if (!(await doesSlugExist(type, shortSlug))) return shortSlug
	const longSlug = y ? `${t}-${a}-${y}` : `${t}-${a}`
	if (!(await doesSlugExist(type, longSlug))) return longSlug
	let i = 2
	while (true) {
		const numberedSlug = `${longSlug}-${i}`
		if (!(await doesSlugExist(type, numberedSlug))) return numberedSlug
		i += 1
	}
}

const doesSlugExist = async (type: string, slug: string) => {
	return (
		(
			await db
				.select()
				.from(Work)
				.where(and(eq(Work.type, type), eq(Work.slug, slug)))
		).length > 0
	)
}
