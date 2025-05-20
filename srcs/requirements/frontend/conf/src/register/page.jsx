import React, { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Gameplay from "../gameplay/menu/page.jsx"
import UserPass from "./UserPass.jsx"

function Register() {

	const canva = useRef(null)

	useEffect(() => {
		if (canva.current)
			canva.current.style.filter = 'blur(5px)'
	}, [])

	return (
		<>
			<header>
				<div className="container position-relative">
					<h1 className="position-relative text-center text-light fw-bolder z-3 p-5 user-select-none" 
						style={{textShadow: "3px 3px 5px rgba(0, 0, 0, 0.7)", fontSize: '6rem'}}>
							Pong.
					</h1>
				</div>
			</header>
			<main>
				<div className="position-fixed top-0">
					<Gameplay canva={canva}/>
					<div className="position-absolute top-0 d-flex justify-content-center align-items-center vh-100 w-100">
						<div className="rounded border border-black border-2 px-3 px-lg-5 pt-2 pt-lg-4 pb-3 pb-lg-4"
							style={{background: "rgba(0, 0, 0, 0.7)"}}>
							<UserPass/>
						</div>
					</div>
				</div>
			</main>
		</>
	)
}

export default Register