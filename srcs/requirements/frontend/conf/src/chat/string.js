export function updateTime(time) {
	if (!time) return ""
	const date = new Date(time)
	const hours = date.getUTCHours().toString().padStart(2, '0')
	const minutes = date.getUTCMinutes().toString().padStart(2, '0')
	const seconds = date.getUTCSeconds().toString().padStart(2, '0')
	return(`${hours}:${minutes}:${seconds}`)
}

export function updateSender(sender) {
	if (!sender) return "".padEnd(10, ' ')
	if (sender.length <= 10)
		return sender.padEnd(10, ' ')
	return sender.slice(0, 9) + '.'
}


export function updateContent(content) {
	if (!content) return ""
	const lines = content.match(/.{1,50}/g) || [content]
	return lines.map((line, index) =>
		index === 0 ? line : ' '.repeat(24) + ': ' + line
	).join('\n')
}
