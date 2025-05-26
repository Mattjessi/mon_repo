import React, { useEffect, useRef, useState } from "react"
import { useGame } from "../../websockets/game"
import { useNotification } from "../../websockets/notification";
import createCanva from "./canva";

const BGprivate = ({ state, type }) => {

	const canva = useRef(null)
	const { getSocket, PongMessages, ScoreMessages} = useGame()
	const { NotifMessages } = useNotification()
	const [groupName, setGroupName] = useState({player1: "...", player2: "..."})
	const [groupScore, setGroupScore] = useState({score1: "0", score2: "0"})

	useEffect(() => {
		if (!canva.current) return
		if (state != "play" && state != "playfinal") canva.current.style.filter = 'blur(5px)'
		else canva.current.style.filter = ""
		const handleKeyDown = (e) => {
			const socket = getSocket()
			let action = ""
			if (e.key == "ArrowUp") action = "move_down"
			if (e.key == "ArrowDown") action = "move_up"
			if (action && type && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ action: action, type: type}))
		}
		const handleKeyUp = (e) => {
			const socket = getSocket()
			let action = ""
			if (e.key == "ArrowUp") action = "down"
			if (e.key == "ArrowDown") action = "up"
			if (action && type && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ action: "key_up", type: action}))
		}
		const resizeCanva = () => {
			canva.current.width = window.innerWidth
			canva.current.height = window.innerHeight
			if (renderer) renderer.setSize(window.innerWidth, window.innerHeight)
			if (camera) {
				camera.aspect = window.innerWidth / window.innerHeight
				camera.updateProjectionMatrix()
			}
		}

		const lastPongMessage = PongMessages[PongMessages.length - 1]
	
		const { dispose, renderer, camera } = createCanva(canva.current, state, lastPongMessage, groupName, groupScore, setGroupScore, ScoreMessages)

		window.addEventListener("resize", resizeCanva)
		window.addEventListener('keydown', handleKeyDown)
		window.addEventListener('keyup', handleKeyUp)

		resizeCanva()

		return () => {
			window.removeEventListener("resize", resizeCanva)
			window.removeEventListener('keydown', handleKeyDown)
			window.removeEventListener('keyup', handleKeyUp)
			dispose()
		}
	}, [ state, PongMessages, ScoreMessages, NotifMessages ])

	useEffect(() => {
		if (NotifMessages.type == "match_created")
			setGroupName({player1: updateNames(NotifMessages.player_1, 1), player2: updateNames(NotifMessages.player_2, 2)})
	}, [NotifMessages])

	const updateNames = (string, types) => {
		if (types === 1) {
			if (string.length <= 8)
				return string.padEnd(8, ' ')
			return string.slice(0, 8) + '.'
		}
		else if (types === 2) {
			if (string.length <= 8)
				return string.padStart(8, ' ')
			return string.slice(-8) + '.'
		}
		return '...'
	}

	return (
			<div className="position-fixed top-0">
				<canvas ref={canva}/>
			</div>)
}

export default BGprivate