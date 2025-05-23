import * as THREE from 'three'
import { setFloor, setFog, setLine, setBorder, setBScreen, setLight, setPaddle, setWall, setBall, setScore, setNames, updateScore } from './shapes'

const setAll = (scene, state, groupName, groupScore) => {

	const floor = setFloor(scene)
	const fog = setFog(scene)
	//const line = setLine()
	const border = setBorder()
	const bscreen = setBScreen()
	const light = setLight(scene)
	const paddle = setPaddle()
	const wall = setWall()
	const ball = setBall()
	const names = setNames(groupName)
	const score = setScore(groupScore)

	if (state == "play") {
		//line.cubes.forEach(cube => scene.add(cube))
		scene.add(paddle.paddleL, paddle.paddleR, wall.wallL, wall.wallR, ball, names)
		scene.add(border, bscreen.bscreen1, bscreen.bscreen2, bscreen.bscreen3, score)
	}
	return {floor, fog, light, paddle, wall, ball, border, bscreen, names, score}
}

const createCanva = (canva, state, lastPongMessage, groupName, groupScore, setGroupScore, ScoreMessages) => {
	
	const scene = new THREE.Scene()

	const camera = new THREE.PerspectiveCamera(60, canva.width / canva.height, 0.1)
	camera.position.set(35, -30, 30)
	camera.lookAt(35, 15, 5)
	
	const renderer = new THREE.WebGLRenderer({ canvas: canva, antialias: true })
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.VSMShadowMap
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.toneMappingExposure = 2.0
	renderer.setSize(canva.width, canva.height)

	const objects = setAll(scene, state, groupName, groupScore)

	let animationFrameId

	const animate = () => {
		if (state == "play") {
			if (groupScore && ScoreMessages && ScoreMessages.scorePlayer1 != undefined && ScoreMessages.scorePlayer2 != undefined &&
				(ScoreMessages.scorePlayer1 != groupScore.score1 || ScoreMessages.scorePlayer2 != groupScore.score2)) {
				updateScore({score1: ScoreMessages.scorePlayer1 != undefined ? ScoreMessages.scorePlayer1 : 0,
							score2: ScoreMessages.scorePlayer2 != undefined ? ScoreMessages.scorePlayer2 : 0},
							scene, objects)
				setGroupScore({score1: ScoreMessages.scorePlayer1 != undefined ? ScoreMessages.scorePlayer1 : 0,
							score2: ScoreMessages.scorePlayer2 != undefined ? ScoreMessages.scorePlayer2 : 0})
			}
		
			objects.paddle.paddleL.position.set(0.5, lastPongMessage ? (lastPongMessage.paddleL + 2.5) : 17.5, 1)
			objects.paddle.paddleR.position.set(70.5, lastPongMessage ? (lastPongMessage.paddleR + 2.5) : 17.5, 1)
			objects.ball.position.set(lastPongMessage ? (lastPongMessage.x + 0.5) : 35.5, lastPongMessage ? (lastPongMessage.y + 0.5) : 15.5, 1)
		}

		renderer.render(scene, camera)
		animationFrameId = requestAnimationFrame(animate)
	}

	animate()

	const dispose = () => {
		cancelAnimationFrame(animationFrameId);
		if (objects.floor) {
			objects.floor.geometry.dispose()
			objects.floor.material.dispose()
			scene.remove(objects.floor)
		}
		if (objects.line && Array.isArray(objects.line.cubes)) {
			objects.line.cubes.forEach(cube => {
				cube.geometry.dispose()
				cube.material.dispose()
				scene.remove(cube)})
		}

		if (objects.light) {
			if (objects.light.ambientLight)
				scene.remove(objects.light.ambientLight)
			if (objects.light.dirLight) {
				scene.remove(objects.light.dirLight)
				if (objects.light.dirLight.target)
					scene.remove(objects.light.dirLight.target)
			}
			if (objects.light.cornerLights && Array.isArray(objects.light.cornerLights))
				objects.light.cornerLights.forEach(light => {scene.remove(light)})
		}
		if (objects.border) {
			objects.border.geometry.dispose()
			objects.border.material.dispose()
			scene.remove(objects.border)
		}
		if (objects.paddle) {
			if (objects.paddle.paddleL) {
				objects.paddle.paddleL.geometry.dispose()
				objects.paddle.paddleL.material.dispose()
				scene.remove(objects.paddle.paddleL)
			}
			if (objects.paddle.paddleR) {
				objects.paddle.paddleR.geometry.dispose()
				objects.paddle.paddleR.material.dispose()
				scene.remove(objects.paddle.paddleR)
			}
		}
		if (objects.wall) {
			if (objects.wall.wallL) {
				objects.wall.wallL.geometry.dispose()
				objects.wall.wallL.material.dispose()
				scene.remove(objects.wall.wallL)
			}
			if (objects.wall.wallR) {
				objects.wall.wallR.geometry.dispose()
				objects.wall.wallR.material.dispose()
				scene.remove(objects.wall.wallR)
			}
		}
		if (objects.ball) {
			objects.ball.geometry.dispose()
			objects.ball.material.dispose()
			scene.remove(objects.ball)
		}
		scene.fog = null
		scene.background = null
		renderer.dispose()
	}

	return {dispose, renderer, camera}
}

export default createCanva