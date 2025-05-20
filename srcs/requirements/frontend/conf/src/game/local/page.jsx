import React, { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "react-bootstrap"
import Header from "../../global/header"
import Gameplay from "../../gameplay/settings/page"
import Settings from './settings/page'
import Skin from './skin/page'

function Local() {

	const navigate = useNavigate()

	const canva = useRef(null)

	const [n, setN] = useState(0)
	const [color, setColor] = useState(0)

	const goPlay = () => {
		//envoie des donnés
		navigate("/local/game")
	}

	return (
		<>
			<Header/>
			<main>
				<div className="position-fixed top-0 w-100">
					<Gameplay canva={ canva } elem={ n } color={ color }/>
					<div className="position-absolute top-0 start-0 d-flex ms-5 align-items-center vh-100 w-25">
						<div className="rounded border border-black border-2 px-3 px-lg-5 pt-2 pt-lg-4 pb-3 pb-lg-4"
							style={{background: "rgba(0, 0, 0, 0.7)"}}>
							<Settings/>
						</div>
					</div>
					<div className="position-absolute top-0 end-0 d-flex me-5 align-items-center vh-100 w-25">
						<div className="rounded border border-black border-2 px-3 px-lg-5 pt-2 pt-lg-4 pb-3 pb-lg-4"
							style={{background: "rgba(0, 0, 0, 0.7)"}}>
							<Skin elem={ n } color={ color } setN={ setN } setColor={ setColor }/>
						</div>
					</div>
					<div className="position-fixed bottom-0 w-100 d-flex justify-content-center mb-5">
						<Button type="submit" className="btn btn-secondary rounded fw-bolder" onClick={ goPlay }>Play !</Button>
					</div>
				</div>
			</main>
		</>
	)
}

export default Local