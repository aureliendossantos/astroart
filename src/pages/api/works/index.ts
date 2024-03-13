import type { APIRoute } from "astro"
import { response } from "$lib/api"
import { Work, db } from "astro:db"

export const GET: APIRoute = async () => {
	const works = await db.select().from(Work)
	return response(200, "Found all works.", works)
}
