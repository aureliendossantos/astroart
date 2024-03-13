import { createWorkSlug, type WorkInsert } from "./works/create"

type MovieDetails = {
	adult: boolean
	backdrop_path: string
	belongs_to_collection: string
	budget: number
	genres: Array<{ id: number; name: string }>
	homepage: string
	id: number
	imdb_id: string
	original_language: string
	original_title: string
	overview: string
	popularity: number
	poster_path: string
	production_companies: Array<{
		id: number
		logo_path: string
		name: string
		origin_country: string
	}>
	production_countries: Array<{
		iso_3166_1: string
		name: string
	}>
	release_date: string
	revenue: number
	runtime: number
	spoken_languages: Array<{
		english_name: string
		iso_639_1: string
		name: string
	}>
	status: string
	tagline: string
	title: string
	video: boolean
	vote_average: number
	vote_count: number
}

type MovieImages = {
	backdrops: Array<{
		aspect_ratio: number
		height: number
		iso_639_1: string
		file_path: string
		vote_average: number
		vote_count: number
		width: number
	}>
	id: number
	logos: Array<{
		aspect_ratio: number
		height: number
		iso_639_1: string
		file_path: string
		vote_average: number
		vote_count: number
		width: number
	}>
	posters: Array<{
		aspect_ratio: number
		height: number
		iso_639_1: string
		file_path: string
		vote_average: number
		vote_count: number
		width: number
	}>
}

type MovieQuery = MovieDetails & { images: MovieImages }

type BackdropSize = 300 | 780 | 1280 | 1920 | "original"
type LogoSize = 45 | 92 | 154 | 185 | 300 | 500 | "original"
type PosterSize = 92 | 154 | 185 | 342 | 500 | 780 | "original"
type ProfileSize = 45 | 185 | 632 | "original"
type StillSize = 92 | 185 | 300 | "original"

const getTMDBimageUrl = (
	size: BackdropSize | LogoSize | PosterSize | ProfileSize | StillSize,
	path: string
) => {
	return `https://image.tmdb.org/t/p/${
		size == "original" ? size : `w${size}`
	}${path}`
}

export async function TMDBtoWorkInsert(tmdb: MovieQuery): Promise<WorkInsert> {
	return {
		title: tmdb.title,
		type: "Movie",
		slug: await createWorkSlug(
			"Movie",
			tmdb.title,
			"",
			new Date(tmdb.release_date).getFullYear()
		),
		sourceId: tmdb.id.toString(),
		createdAt: new Date(),
		updatedAt: new Date(),
	}
}

const iso_639_1_toDatabase = (iso_639_1: string | null) => {
	switch (iso_639_1) {
		case "en":
			return "en"
		case "fr":
			return "fr"
		case null:
			return "any"
		default:
			console.warn(`Unsupported ISO 639-1 code: ${iso_639_1}`)
			return null
	}
}

/**
 * Get a movie from TMDB using its ID.
 * TODO: Add support for TV shows.
 * @param id ID of the movie on TMDB
 * @returns Response format: https://developer.themoviedb.org/reference/movie-details
 */
export default async function getTMDBfromID(id: number) {
	const options: RequestInit = {
		method: "GET",
		headers: {
			accept: "application/json",
			Authorization: `Bearer ${import.meta.env.TMDB_READ_ACCESS_TOKEN}`,
		},
	}
	const movie = await fetch(
		`https://api.themoviedb.org/3/movie/${id}?language=en-US&append_to_response=credits,images&include_image_language=en,fr,null`,
		options
	)
		.then((response) => response.json())
		.catch((err) => console.error(err))
	if (movie.success == false) {
		console.error("Error. TMDB response:", movie)
		return null
	}
	return movie as MovieQuery
}
