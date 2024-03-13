import { getIGDBfromSlug } from "$lib/igdb"
import { Work, and, db, eq } from "astro:db"

/**
 * Find a work using either a source ID or a source slug.
 * @returns The work, or `null` if not found.
 */
export const findWork = async (
	type: string,
	id: string | undefined,
	slug: string | undefined
) => {
	if (id) return await findWorkUsingSourceId(type, id)
	if (slug) return await findWorkUsingSourceSlug(type, slug)
	return null
}

export const workPathToWorkType = (pathName: string) => {
	switch (pathName) {
		case "games":
			return "VideoGame"
		case "movies":
			return "Movie"
		default:
			return null
	}
}

export const workTypeToWorkPath = (type: string) => {
	switch (type) {
		case "VideoGame":
			return "games"
		case "Movie":
			return "movies"
		default:
			return null
	}
}

const findWorkUsingSourceId = async (type: string, id: string) => {
	return await db
		.select()
		.from(Work)
		.where(and(eq(Work.type, type), eq(Work.sourceId, id)))
		.get()
}

const findWorkUsingSourceSlug = async (type: string, slug: string) => {
	if (type === "VideoGame") {
		const igdb = await getIGDBfromSlug(slug)
		if (!igdb) return null
		return await db
			.select()
			.from(Work)
			.where(eq(Work.sourceId, igdb.id.toString()))
			.get()
	}
	// There are no slugs on TMDB.
	return null
}
