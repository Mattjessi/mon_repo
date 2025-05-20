import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "react-bootstrap"
import FriendModal from "../global/friend-modal.jsx"
import ChatModal from "../global/chat-modal.jsx"
import QuitModal from "../global/quit-modal.jsx"

function Header({}) {

	const navigate = useNavigate();
	const [friend, setFriend] = useState(false)
	const [chat, setChat] = useState(false)
	const [quit, setQuit] = useState(false)

	return (
		<>
			<header>
				<nav className="navbar bg-dark opacity-75 fixed-top p-2">
					<div className="container-fluid p-0 m-0">
						<Button className="rounded-0 btn btn-dark fw-bolder">
							<i className="bi bi-gear-fill" style={{fontSize: "40px"}}/>
						</Button>
						<Button className="rounded-0 btn btn-dark fw-bolder" onClick={() => navigate("/home")}>
							<i className="bi bi-house-fill" style={{fontSize: "40px"}}/>
						</Button>
						<Button className="rounded-0 btn btn-dark fw-bolder" onClick={() => navigate(`/profile/${localStorage.getItem("playerName")}`)}>
							<i className="bi bi-person-lines-fill" style={{fontSize: "40px"}}/>
						</Button>
						<h1 className="navbar-brand text-bg-dark fw-bolder fs-1 m-0 p-0 user-select-none"
							style={{textShadow: "3px 3px 5px rgba(0, 0, 0, 0.7)"}}>Pong.</h1>
						<Button className="rounded-0 btn btn-dark fw-bolder" onClick={() => setFriend(true)}>
							<i className="bi bi-people-fill" style={{fontSize: "40px"}}/>
						</Button>
						<Button className="rounded-0 btn btn-dark fw-bolder" onClick={() => setChat(true)}>
							<i className="bi bi-chat-dots-fill" style={{fontSize: "40px"}}/>
						</Button>
						<Button className="rounded-0 btn btn-dark fw-bolder" onClick={() => setQuit(true)}>
							<i className="bi bi-power" style={{fontSize: "40px"}}/>
						</Button>
					</div>
				</nav>
			</header>
			<FriendModal friend={ friend } setFriend={ setFriend }/>
			<ChatModal chat={ chat } setChat={ setChat }/>
			<QuitModal quit={ quit } setQuit={ setQuit }/>
		</>
	)
}

export default Header