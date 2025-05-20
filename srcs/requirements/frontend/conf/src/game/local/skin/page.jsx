import React from "react"
import { Button, Form, Dropdown } from "react-bootstrap"
import './style.css'

function Skin({elem, color ,setN, setColor}) {

	const skins = ["white", "dark",	"blue", "red",
					"yellow", "green", "orange", "purple"]

	const updateObject = (id) => {
		//envoie de color à elem
		setN(id)
		setColor(0)
	}

	return (
		<Form>
			<Dropdown className="d-flex justify-content-center pt-3 mb-3 mb-lg-5">
				<Dropdown.Toggle className="btn btn-light rounded fw-bolder">Select an Object</Dropdown.Toggle>
				<Dropdown.Menu>
				<Dropdown.Item onClick={() => updateObject(0)}>Player 1</Dropdown.Item>
					<Dropdown.Item onClick={() => updateObject(1)}>Player 2</Dropdown.Item>
					<Dropdown.Item onClick={() => updateObject(2)}>Ball</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			<Form.Group className="fs-5 fs-lg-4 mb-3">
				<div className="d-flex flex-wrap gap-4 justify-content-start">
				{skins.map((color, index) => (
      				<Button
						key={color}
        				type="button"
        				onClick={() => setColor(index)}
        				className={`local-skin-btn local-skin-btn-${color}`}
						style={{ width: '45%', height: '50px' }}/>))}
				</div>
			</Form.Group>
		</Form>
	)
}

export default Skin