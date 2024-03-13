import { db, gt, IgdbAccessToken } from "astro:db"
import { createWorkSlug, type WorkInsert } from "./works/create"

export type IGDBImage = {
	image_id: string
	width: number
	height: number
}

export type IGDBData = {
	id: number
	name: string
	slug: string
	cover?: IGDBImage
	screenshots?: IGDBImage[]
	platforms?: { abbreviation: string }[]
	first_release_date?: number
	release_dates?: { y: number }[]
	involved_companies?: {
		developer: boolean
		publisher: boolean
		company: { name: string }
	}[]
	websites?: { category: number; url: string }[]
	url: string
}

export async function IGDBtoWorkInsert(igdb: IGDBData): Promise<WorkInsert> {
	const slug = await createWorkSlug(
		"VideoGame",
		igdb.name,
		"",
		igdb.first_release_date
			? new Date(igdb.first_release_date * 1000).getFullYear()
			: undefined
	)
	return {
		type: "VideoGame",
		title: igdb.name,
		slug: slug,
		sourceId: igdb.id.toString(),
		createdAt: new Date(),
		updatedAt: new Date(),
	}
}

export async function getIGDBfromSlug(slug: string) {
	console.log(`Getting IGDB data for ${slug}...`)
	return (await getIGDBgames([slug], undefined, undefined, 1))[0]
}

export async function getIGDBfromID(id: number) {
	console.log(`Getting IGDB data for ${id}...`)
	return (await getIGDBgames(undefined, [id], undefined, 1))[0]
}

export default async function getIGDBgames(
	slugs?: string[],
	ids?: number[],
	searchedName?: string,
	limit: number = 500
) {
	if (!slugs && !ids && !searchedName) {
		console.error("No query parameters")
		return []
	}

	const token = await getIGDBtoken()

	const parameters = (body: string): RequestInit => {
		return {
			method: "POST",
			headers: {
				"Client-ID": import.meta.env.TWITCH_ID as string,
				Authorization: `Bearer ${token}`,
			},
			body: body,
		}
	}

	const slugsQuery = slugs
		? `where slug = (${slugs.map((slug) => `"${slug}"`).join()});`
		: ""
	const idsQuery = ids ? `where id = (${ids.join()});` : ""
	const nameQuery = searchedName ? `search "${searchedName}";` : ""

	const games: IGDBData[] = await fetch(
		`https://api.igdb.com/v4/games`,
		parameters(
			`fields name, slug, cover.image_id, cover.width, cover.height, screenshots.image_id, screenshots.width, screenshots.height, platforms.abbreviation, first_release_date, release_dates.y, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, websites.category, websites.url, url; ${slugsQuery}${idsQuery} ${nameQuery} limit ${limit};`
		)
	).then((response) => response.json())
	if (!("forEach" in games)) {
		console.error(games)
		return []
	}
	return games
}

async function getIGDBtoken() {
	const token = await db
		.select()
		.from(IgdbAccessToken)
		.where(gt(IgdbAccessToken.expiresAt, new Date()))
		.get()
	if (token) return token.token

	console.log("Getting new IGDB token...")
	const authentication: {
		access_token: string
		expires_in: number
		token_type: string
	} = await fetch(
		`https://id.twitch.tv/oauth2/token?client_id=${
			import.meta.env.TWITCH_ID
		}&client_secret=${
			import.meta.env.TWITCH_SECRET
		}&grant_type=client_credentials`,
		{
			method: "POST",
		}
	).then((response) => response.json())
	if (!authentication.expires_in)
		console.error("IGDB authentification:", authentication)

	const expiresAt = new Date(Date.now() + 1000 * authentication.expires_in)

	const newToken = await db
		.insert(IgdbAccessToken)
		.values({ token: authentication.access_token, expiresAt: expiresAt })
		.returning()
		.get()
	console.log("newToken:", newToken)

	return newToken.token
}
