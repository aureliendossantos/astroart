export const response = (status: number, message: string, data?: any) => {
	return new Response(JSON.stringify({ message, data }), { status })
}
