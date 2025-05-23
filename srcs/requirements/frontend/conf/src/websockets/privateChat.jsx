import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router-dom"
import axiosInstance from '../auth/instance'
import { useAuth } from '../auth/context'

const PrivateChatContext = createContext(null)

export const usePrivateChat = () => useContext(PrivateChatContext)

export const PrivateChat = ({ children }) => {
	const navigate = useNavigate()
	const socketRef = useRef(null)
	const [privMessages, setMessages] = useState([])
	const { user } = useAuth()

	useEffect(() => {
		if (!user) return
		const Rtoken = localStorage.getItem("Rtoken")
		if (!Rtoken) return

		let isMounted = true
		let wsInstance = null

		const createPrivateSocket = async (Rtoken, onMessage, onError, onClose) => {
			const tokens = await axiosInstance.post('/users/api/token/refresh/', { refresh: Rtoken })
			const ws = new WebSocket(`wss://${location.host}/live_chat/ws/chat/private/${user.id}/?token=${tokens.data.access}`)
		
			ws.onopen = () => {console.log("PrivateSocket connected")}
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data)
				onMessage?.(data)
			}
			ws.onerror = (error) => {onError?.(error)}
			ws.onclose = () => {onClose?.()}
			return ws
		}

		const initPrivateSocket = async () => {
			try {
				const ws = await createPrivateSocket(Rtoken, (data) => {
					if (data && data.code == 1000) return
					console.log("PrivateSocket notif => ", data)
					setMessages(data)
				}, (error) => {
					console.error("PrivateSocket error", error)
					navigate("/home")
				}, () => {
					setMessages([])
					console.log("PrivateSocket closed")
				})
				if (isMounted) {
					socketRef.current = ws
					wsInstance = ws
				}
			}
			catch(error) {console.log("Failed to create PrivateSocket: ", error)}
		}

		initPrivateSocket()

		return () => {
			isMounted = false
			if (wsInstance?.readyState === WebSocket.OPEN || wsInstance?.readyState === WebSocket.CONNECTING)
				wsInstance.close()
		}
	
	}, [user])

	return (
		<PrivateChatContext.Provider value={{ getSocket: () => socketRef.current, privMessages }}>
			{children}
		</PrivateChatContext.Provider>
	)
}
