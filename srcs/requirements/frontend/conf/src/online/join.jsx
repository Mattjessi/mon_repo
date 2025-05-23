import React, { useEffect, useState } from "react"
import { Modal, Button } from "react-bootstrap"
import { useAuth } from "../auth/context"
import axiosInstance from "../auth/instance"

function JoinMatch({ state, setState, setType }) {

	const [data, setData] = useState(null)
	const { user } = useAuth()

	const fonction = async () => {
		try {
			const playerData = await axiosInstance.get('/users/api/player/')
			const invitations = await axiosInstance.get("pong/invitations/")
			const getAvatar = (name) => {
				const Avatar = playerData.data.find(player => player.name === name)
				if (Avatar) return Avatar.avatar
				return null
			}
			const a = invitations.data
				.filter(player => player.to_player.id == user.id)
				.map(player => ({name: player.from_player.name, id: player.id, avatar: getAvatar(player.from_player.name)}))
			setData(a)
		}
		catch(error) {
			console.log(error)
		}
	}

	const accept = async (id) => {
		try {
			await axiosInstance.put(`pong/invitations/${id}/accept/`)
			setType("paddle_r")
			setState("wait")
		}
		catch(error) {
			console.log(error)
			setState("")
		}
	}

	const decline = async (id) => {
		try {
			await axiosInstance.put(`pong/invitations/${id}/decline/`)
			setState("")
		}
		catch(error) {
			console.log(error)
			setState("")
		}
	}

	useEffect(() => {
		fonction()
	}, [state])

	return (
		<Modal show={state == "join"}>
			<Modal.Header closeButton onClick={() => setState("")}>
				<Modal.Title>Who would you want to join ?</Modal.Title>
			</Modal.Header>
			<Modal.Body className="d-flex flex-column align-items-center">
				<ul className="list-unstyled w-100 d-flex flex-column align-items-center gap-3">
					{data && data.length > 0 
						? (data.map((player, index) => (
						<li key={index} className="bg-light rounded p-2 w-75 border-bottom">
							<div className="d-flex justify-content-between align-items-center">
								<div className="d-flex align-items-center gap-3">
									<img src={player.avatar} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
									<span className="fw-bold">{player.name}</span>
								</div>
								<div className="d-flex gap-2">
									<Button variant="success" onClick={() => accept(player.id)}>Accept</Button>
									<Button variant="danger" onClick={() => decline(player.id)}>Decline</Button>
								</div>
							</div>
						</li>)))
						: <li>No friends found</li>}
				</ul>
			</Modal.Body>
		</Modal>
	)
}

export default JoinMatch