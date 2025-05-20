import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Modal } from "react-bootstrap"
import axios from 'axios'

function ChatModal({ chat, setChat }) {

	const navigate = useNavigate()

	const handleClose = () => setChat(false)

	const Atoken = localStorage.getItem('accessToken')
	const Rtoken = localStorage.getItem('refreshToken')
	const PlayerName = localStorage.getItem('playerName')
	const config = {headers: {Authorization: `Bearer ${Atoken}`}}
	const params = { token: Rtoken }

	const fonction = async () => {

		try {}
		catch(error) {
			console.log(error)
		}
	}

	return (
		<Modal show={chat} onHide={handleClose}>
			<Modal.Header closeButton />
			<Modal.Body>
				<div className="container-fluid">
  					<div className="row">
    					<div className="col-12 col-md-4 d-flex justify-content-center align-items-center">
							<div className="border border-2 rounded-3" style={{width: "100%", maxWidth: "500px", height: "500px"}}>
        						<div className="chat-box p-3 d-flex flex-column justify-content-between h-100">
        							<div className="messages flex-grow-1 overflow-auto">
									</div>
        							<div className="input-box mt-2">
            							<input type="text" className="form-control" placeholder="Type a message..." aria-label="Type a message..." />
        							</div>
        						</div>
    						</div>
    					</div>
						<div className="col-12 col-md-8">
    						<div className="border border-2 rounded-3 h-100">
        						<div className="list-group h-100">
								</div>
							</div>
						</div>
					</div>
				</div>
			</Modal.Body>
		</Modal>
	)
}

export default ChatModal