import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router-dom"
import { useAuth } from '../auth/context'
import axiosInstance from '../auth/instance'

const ChatContext = createContext(null)

export const useChat = () => useContext(ChatContext)

export const Chat = ({ children }) => {
	const navigate = useNavigate()
	const socketRef = useRef(null)
	const [messages, setMessages] = useState([])
	const { isAuth } = useAuth()

	useEffect(() => {
		if (!isAuth) return
		const Rtoken = localStorage.getItem("Rtoken")
		if (!Rtoken) return

		let isMounted = true
		let wsInstance = null

		const createChatSocket = async (Rtoken, onMessage, onError, onClose) => {
			const tokens = await axiosInstance.post('/users/api/token/refresh/', { refresh: Rtoken })
			const ws = new WebSocket(`wss://${location.host}/live_chat/ws/chat/general/?token=${tokens.data.access}`)

			ws.onopen = () => {console.log("ChatSocket connected")}
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data)
				onMessage?.(data)
			}
			ws.onerror = (error) => {onError?.(error)}
			ws.onclose = () => {onClose?.()}
			return ws
		}

		const initChatSocket = async () => {
			try {
				const ws = await createChatSocket(Rtoken, (data) => {
					if (data && data.code == 1000) return
					console.log("Chat notif => ", data)
					setMessages(data)
				}, (error) => {
					console.error("ChatSocket error", error)
					navigate("/home")
				}, () => {
					setMessages([])
					console.log("ChatSocket closed")
				})
				if (isMounted) {
					socketRef.current = ws
					wsInstance = ws
				}
			}
			catch(error) {console.log("Failed to create ChatSocket: ", error)}
		}

		initChatSocket()

		return () => {
			isMounted = false
			if (wsInstance?.readyState === WebSocket.OPEN || wsInstance?.readyState === WebSocket.CONNECTING)
				wsInstance.close()
		}

	}, [isAuth])

	return (
		<ChatContext.Provider value={{ getSocket: () => socketRef.current, messages }}>
			{children}
		</ChatContext.Provider>
	)
}
