import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router-dom"
import axiosInstance from '../auth/instance'
import { useAuth } from "../auth/context.jsx"

const NotificationContext = createContext(null)

export const useNotification = () => useContext(NotificationContext)

export const Notification = ({ children }) => {
	const navigate = useNavigate()
	const socketRef = useRef(null)
	const [NotifMessages, setNotifMessages] = useState([])
	const { isAuth } = useAuth()

	useEffect(() => {
		if (!isAuth) return
		const Rtoken = localStorage.getItem("Rtoken")
		if (!Rtoken) return

		let isMounted = true
		let wsInstance = null

		const createNotifSocket = async (Rokten, onMessage, onError, onClose) => {
			const tokens = await axiosInstance.post('/users/api/token/refresh/', { refresh: Rtoken })
			const ws = new WebSocket(`wss://${location.host}/pong/ws/notifications/?token=${tokens.data.access}`)
			
			ws.onopen = () => {console.log("NotifSocket connected")}
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data)
				onMessage?.(data)
			}
			ws.onerror = (error) => {onError?.(error)}
			ws.onclose = () => {onClose?.()}
			return ws
		}

		const initNotifSocket = async () => {
			try {
				const ws = await createNotifSocket(Rtoken, (data) => {
					if (data.type == "invitation_declined") setNotifMessages(data) //console.log(`${data.to_player} declined your invitation.`)
					else if (data.type == "invitation_received") console.log(`${data.from_player} invited you.`)
					else if (data.type == "match_created") setNotifMessages(data) //console.log(`Match [${data.match_id}] has been created.`)
					else if (data.type == "player_joined") setNotifMessages(data) //console.log(`Player [${data.joined_player}] has joined.`)
					else if (data.type == "player_leave") setNotifMessages(data) //console.log(`Player [${data.leaved_player}] has left.`)
					else if (data.type == "tournament_created") setNotifMessages(data)
					else if (data.type == "tournament_cancelled") setNotifMessages(data)
					else console.log(data)
				}, (error) => {
					console.error("NotifSocket error", error)
					navigate("/home")
				}, () => {
					setNotifMessages([])
					console.log("NotifSocket closed")
				})
				if (isMounted) {
					socketRef.current = ws
					wsInstance = ws
				}
			}
			catch(error) {console.log("Failed to create NotifSocket: ", error)}
		}

		initNotifSocket()

		return () => {
			isMounted = false
			if (wsInstance?.readyState === WebSocket.OPEN || wsInstance?.readyState === WebSocket.CONNECTING)
				wsInstance.close()
		}

	}, [isAuth])

	return (
		<NotificationContext.Provider value={{ socket: socketRef.current, NotifMessages, setNotifMessages }}>
			{children}
		</NotificationContext.Provider>
	)
}
