import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router-dom"
import axiosInstance from '../auth/instance'

const GameContext = createContext(null)

export const useGame = () => useContext(GameContext)

export const Game = ({ children }) => {
	const navigate = useNavigate()
	const socketRef = useRef(null)
	const [messages, setMessages] = useState([])
	const [PongMessages, setPongMessages] = useState([])
	const [ScoreMessages, setScoreMessages] = useState([])
	const [url, setUrl] = useState('')

	useEffect(() => {
		if (!url) return
		const Rtoken = localStorage.getItem("Rtoken")
		if (!Rtoken) return

		let isMounted = true
		let wsInstance = null

		const createGameSocket = async (url, Rtoken, onMessage, onError, onClose) => {
			const tokens = await axiosInstance.post('/users/api/token/refresh/', { refresh: Rtoken })
			const ws = new WebSocket(`${url}?token=${tokens.data.access}`)

			ws.onopen = () => {console.log("GameSocket connected")}
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data)
				onMessage?.(data)
			}
			ws.onerror = (error) => {onError?.(error)}
			ws.onclose = () => {onClose?.()}
			return ws
		}

		const initGameSocket = async () => {
			try {
				const ws = await createGameSocket(url, Rtoken, (data) => {
				if (data.type == "data_pong") setPongMessages((prev) => [...prev, data])
				else if (data.type == "score_update") setScoreMessages(data)
				else if (data.type) setMessages((prev) => [...prev, data])
				else console.log(data)
				}, (error) => {
					console.error("GameSocket error", error)
					navigate("/home")
				}, () => {
					setUrl("")
					setMessages([])
					setPongMessages([])
					setScoreMessages([])
					console.log("GameSocket closed")
				})
				if (isMounted) {
					socketRef.current = ws
					wsInstance = ws
				}
			}
			catch(error) {console.log("Failed to create GameSocket: ", error)}
		}

		initGameSocket()

		return () => {
			isMounted = false
			if (wsInstance?.readyState === WebSocket.OPEN || wsInstance?.readyState === WebSocket.CONNECTING)
				wsInstance.close()
		}

	}, [url])

	const closeSocket = () => {
		if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING)
			socketRef.current.close()
	}


	/*useEffect(() => {
		const handleBeforeUnload = () => {
			if (socketRef.current?.readyState === WebSocket.OPEN)
				socketRef.current.close()
		}
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {window.removeEventListener('beforeunload', handleBeforeUnload)}
	}, [])*/

	return (
		<GameContext.Provider value={{ messages, setMessages, PongMessages, setPongMessages,
			ScoreMessages, setScoreMessages, url, setUrl, getSocket: () => socketRef.current, closeSocket }}>
			{children}
		</GameContext.Provider>
	)
}