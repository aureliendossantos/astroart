import type { APIRoute } from "astro"
import { getIGDBfromID, getIGDBfromSlug, type IGDBData } from "$lib/igdb"
import getTMDBfromID from "$lib/tmdb"
import { findWork } from "$lib/works/find"
import { createWork } from "$lib/works/create"
import { response } from "$lib/api"

export const GET: APIRoute = async ({ request }) => {
	const searchParams = new URL(request.url).searchParams
	const source = searchParams.get("type")
	const id = searchParams.get("id")
	const slug = searchParams.get("slug")
	// Checking incorrect parameters
	if (source !== "VideoGame" && source !== "Movie")
		return response(400, "No supported source given.")
	if (!id && !slug) return response(400, "No ID or slug given.")
	// Finding existing work in the database and updating it
	const existingWork = await findWork(source, id!, slug!)
	if (existingWork) {
		// TODO: const { updated, work } = await checkForUpdates(existingWork)
		return response(
			200,
			false // updated
				? "The work had not been updated for 24 hours and is now up to date."
				: "Found existing work.",
			existingWork // work
		)
	}
	// If no work is found, creating a new one
	if (source === "VideoGame") {
		let igdb: IGDBData
		if (id) igdb = await getIGDBfromID(Number(id))
		else igdb = await getIGDBfromSlug(slug as string)
		if (!igdb) return response(404, "Work not found on IGDB.")
		const work = await createWork(source, igdb)
		return response(200, "Added this work to the database.", work)
	}
	if (source === "Movie") {
		if (!id) return response(400, "No TMDB ID given.")
		const tmdb = await getTMDBfromID(Number(id))
		if (!tmdb) return response(404, "Work not found on TMDB.")
		const work = await createWork(source, tmdb)
		return response(200, "Added this work to the database.", work)
	}
	return response(400, "Unknown error.")
}
