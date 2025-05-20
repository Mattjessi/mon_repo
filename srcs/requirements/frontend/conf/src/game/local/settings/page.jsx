import React, { useState, useEffect } from "react"
import { Form } from "react-bootstrap"

function Settings({starting}) {

	const speed = ["Slow", "Normal", "Fast"]
	const [rounds, setRounds] = useState(5)
	const [paddleSpeed, setPaddleSpeed] = useState(1)
	const [ballSpeed, setBallSpeed] = useState(1)

	const [nickname1, setNickname1] = useState("")
	const [nickname2, setNickname2] = useState("")

	useEffect(() => {
		if (!starting) return
		//send infos
	}, [starting])

	return (
		<Form>
			<Form.Group className="fs-5 fs-lg-4 mb-3">
				<Form.Label className="mb-2 text-light">Number of rounds : {rounds}</Form.Label>
				<Form.Range min={1} max={9} value={rounds} onChange={(e) => setRounds(e.target.value)} />
				<Form.Label className="mb-2 text-light">Paddle Speed : {speed[paddleSpeed]}</Form.Label>
				<Form.Range min={0} max={2} value={paddleSpeed} onChange={(e) => setPaddleSpeed(e.target.value)} />
				<Form.Label className="mb-2 text-light">Ball Speed : {speed[ballSpeed]}</Form.Label>
				<Form.Range min={0} max={2} value={ballSpeed} onChange={(e) => setBallSpeed(e.target.value)} />
			</Form.Group>
			<Form.Group className="fs-5 fs-lg-4 mb-3">
				<Form.Label className="mb-2 text-light">Custom Names</Form.Label>
				<Form.Control 
					type="text" 
					placeholder="Player 1" 
					value={nickname1} 
					onChange={(e) => setNickname1(e.target.value)}
				/>
				<Form.Control 
					type="text" 
					placeholder="Player 2" 
					value={nickname2} 
					onChange={(e) => setNickname2(e.target.value)}
				/>
			</Form.Group>
		</Form>
	  )
}

export default Settings