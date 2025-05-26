import React, { useState, useEffect } from "react"
import { Button } from "react-bootstrap"
import Header from "../global/header"
import BGprivate from "../test/private/page.jsx"
import InviteMatch from "./invite.jsx"
import JoinMatch from "./join.jsx"
import WaitMatch from "./wait.jsx"
import PlayMatch from "./play.jsx"
import { useNotification } from "../websockets/notification.jsx"
import axiosInstance from "../auth/instance.jsx"

function Online({ user }) {

	const [state, setState] = useState("")
	const [type, setType] = useState("")
	const { setNotifMessages } = useNotification()

	const fonction = async () => {
		try {
			const matchData = await axiosInstance.get(`/pong/matches/?player_id=${user.id}`)
			const inviteData = await axiosInstance.get("/pong/invitations/")
			const a = matchData.data
				.filter(match => match.status == "En cours" && (match.player_1.name == user.name || match.player_2.name == user.name))
			if (a.length) {
				if (a[a.length - 1].player_1 != undefined && a[a.length - 1].player_2 != undefined &&
					a[a.length - 1].player_1.name != undefined && a[a.length - 1].player_2.name != undefined) {
					setNotifMessages({
						type: "match_created",
						player_1: a[a.length - 1].player_1.name,
						player_2: a[a.length - 1].player_2.name,
						ws_url: a[a.length - 1].url.ws_url})
					if (a[a.length - 1].player_1.name == user.name) setType("paddle_l")
					else if (a[a.length - 1].player_2.name == user.name) setType("paddle_r")
					setState("wait")
				}
			}
			const b = inviteData.data.find(invite => invite.status == "En attente" && invite.from_player.name == user.name)
			if (b) {
				setType("paddle_l")
				setState("wait")
			}
		}
		catch {}
	}

	useEffect(() => {
		if (state != "play")
			fonction()
	}, [state])

	return (
		<>
			<Header user={ user } state={ state } setState={ setState }/>
			<main>
				<BGprivate state={ state } type={ type }/>
				{state == "" || state == "invite" || state == "join" ?
				<div className="position-absolute top-0 d-flex justify-content-center align-items-center vh-100 w-100">
					<div className="rounded border border-black border-2 px-3 px-lg-5 pt-2 pt-lg-4 pb-3 pb-lg-4"
						style={{background: "rgba(0, 0, 0, 0.7)"}}>
						<h1 className="text-white text-center mb-4">Online</h1>
						<div className="d-flex flex-column gap-3">
							<Button type="button" className="btn btn-secondary rounded fw-bolder" onClick={() => setState("invite")}>Invite</Button>
							<Button type="button" className="btn btn-secondary rounded fw-bolder" onClick={() => setState("join")}>Join</Button>
						</div>
					</div>
				</div> : <></>}
				<InviteMatch state={ state } setState={ setState } setType={ setType }/>
				<JoinMatch state={ state } setState={ setState } setType={ setType }/>
				{state == "wait" ?
				<WaitMatch setState={ setState }/> : <></>}
				{state == "play" ?
				<PlayMatch/> : <></>}
			</main>
		</>
	)
}

export default Online