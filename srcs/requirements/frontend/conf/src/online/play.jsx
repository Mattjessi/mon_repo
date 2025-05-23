import React, { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useGame } from "../websockets/game"
import { Modal, Button } from "react-bootstrap"
import { confetti } from "dom-confetti"

function WinnerModal({ winnerName, show, onClose }) {

	const confettiRef = useRef(null)
	const navigate = useNavigate()

	useEffect(() => {
		if (show && confettiRef.current) {
			confetti(confettiRef.current, {
				elementCount: 100,
				angle: 90,
				spread: 90
			})
		}
	}, [show])

	const backToMenu = () => {
		onClose()
		navigate("/home")
	}

	return (
		<Modal show={show} onHide={onClose} centered>
			<Modal.Body className="text-center">
				<div ref={confettiRef} />
				<h2 className="fw-bold">🏆 {winnerName} wins!</h2>
				<p>Congratulations!</p>
				<Button variant="primary" onClick={() => backToMenu()}>Back to Menu</Button>
			</Modal.Body>
		</Modal>
	)
}

function PlayMatch() {

	const { getSocket, closeSocket, messages } = useGame()
	const { setMessages, setPongMessages, setScoreMessages } = useGame()
	const [paused, setPaused] = useState(false)
	const [end, setEnd] = useState(false)
	const closeEnd = () => setEnd(false)
	const [winner, setWinner] = useState("")
	const [timer, setTimer] = useState(60)
	const [showTimer, setShowTimer] = useState(true)
	const socket = getSocket()

	useEffect(() => {
		if (!messages.length) return
		const lastMessage = messages[messages.length - 1]
		console.log(lastMessage)
		if (lastMessage.type == "match_ended") {
			closeSocket()
			setWinner(lastMessage.winner)
			setPaused(false)
			setEnd(true)
			setMessages([])
			setPongMessages([])
			setScoreMessages([])
		}
		if (lastMessage.type == "game_paused")
			setPaused(true)
		if (lastMessage.type == "player_count" && lastMessage.player_count == 1) {
			setPaused(true)
			setShowTimer(false)
		}
		if (lastMessage.type == "forfeit_not_available") {
			setTimer(lastMessage.remaining_seconds)
		}
		if (lastMessage.type == "player_count" && lastMessage.player_count == 2) {
			setPaused(false)
			setShowTimer(true)
		}
	}, [messages])

	useEffect(() => {
		if (paused == false || showTimer == false || !socket || socket.readyState != WebSocket.OPEN) return

		const interval = setInterval(() => {
			socket.send(JSON.stringify({ action: "declare_win" }))
		}, 1000)

		const timeout = setTimeout(() => {
			clearInterval(interval)
		}, 90000)

		return () => {
			clearInterval(interval)
			clearTimeout(timeout)
		}
	}, [paused])

	return (
		<>
		{paused ? 
		<div className="position-absolute top-0 d-flex flex-column justify-content-center align-items-center vh-100 w-100">
  			<i className="bi bi-pause-circle" style={{ fontSize: "20rem", color: "white" }} />
			<div className="fs-1 mb-5">
				{showTimer ? `Timer : ${timer}s` : ""}
			</div>
		</div> : <></> }
		<WinnerModal winnerName={ winner } show={ end } onClose={ closeEnd }/>
		</>
	)
}

export default PlayMatch