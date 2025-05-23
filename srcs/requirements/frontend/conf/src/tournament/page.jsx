import React, { useState, useEffect } from "react"
import { Button } from "react-bootstrap"
import Header from "../global/header"
import BGprivate from "../test/private/page.jsx"
import JoinMatch from "./join.jsx"
import WaitMatch from "./wait.jsx"
import PlayMatch from "./play.jsx"
import { useNotification } from "../websockets/notification.jsx"
import axiosInstance from "../auth/instance.jsx"
import WaitFinal from "./waitFinal.jsx"

function Tournament({ user }) {

	const [state, setState] = useState("")
	const [type, setType] = useState("")
	const { setNotifMessages } = useNotification()

	const fonction = async () => {
		try {
			const tournamentData = await axiosInstance("/pong/tournament/list/")
			const idData = await axiosInstance.get("/pong/tournament/get-id/")
			let finalistData
			const a = tournamentData.data
				.find(match => match.status == "Ouvert" &&
				(match.player_1 == user.id || match.player_2 == user.id ||
				match.player_3 == user.id || match.player_4 == user.id))
			if (a) {
				setState("wait")
				setNotifMessages({type: "tournament_created"})
			}
			if (idData) {
				finalistData = await axiosInstance.get(`/pong/tournaments/${idData.data.tournament_id}/finalists/`)
				console.log(finalistData)
			}
		}
		catch(error) {
			console.log(error)
		}
	}

	const create = async () => {
		try {
			await axiosInstance.post("pong/tournament/create/", {
				name: `${user.name}'s tournament`,
				max_score_per_round: 3,
				number_of_rounds: 1,
			})
			setNotifMessages({type: "tournament_created"})
			setState("wait")
		}
		catch(error) {console.log(error)}
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
				{state == "" || state == "join" ?
				<div className="position-absolute top-0 d-flex justify-content-center align-items-center vh-100 w-100">
					<div className="rounded border border-black border-2 px-3 px-lg-5 pt-2 pt-lg-4 pb-3 pb-lg-4"
						style={{background: "rgba(0, 0, 0, 0.7)"}}>
						<h1 className="text-white text-center mb-4">Tournament</h1>
						<div className="d-flex flex-column gap-3">
							<Button type="button" className="btn btn-secondary rounded fw-bolder" onClick={() => create()}>Create</Button>
							<Button type="button" className="btn btn-secondary rounded fw-bolder" onClick={() => setState("join")}>Join</Button>
						</div>
					</div>
				</div> : <></>}
				<JoinMatch state={ state } setState={ setState } setType={ setType }/>
				{state == "wait" ?
				<WaitMatch setState={ setState } type={ type } setType={ setType }/> : <></>}
				{state == "play" ?
				<PlayMatch setState={ setState }/> : <></>}
				{state == "waitfinal" ?
				<WaitFinal setState={ setState } type={ type } setType={ setType }/> : <></>}
			</main>
		</>
	)
}

export default Tournament