import random
from channels.db import database_sync_to_async
from core.models import Game, StatusChoices
import math

@database_sync_to_async
def get_game(game_id):
    return Game.objects.get(id=game_id)

async def game_pong(game_id, consumer):
    game = await get_game(game_id)
    
    # Utiliser les variables temporaires du consumer
    ball_x = consumer.c_ballx.get(consumer.match_id, game.canvas_width // 2)
    ball_y = consumer.c_bally.get(consumer.match_id, game.canvas_height // 2)
    ball_dx = consumer.c_balldx.get(consumer.match_id, 1)
    ball_dy = consumer.c_balldy.get(consumer.match_id, 0)
    paddle_l_position = consumer.c_paddleL.get(consumer.match_id, (game.canvas_height - game.paddle_height) // 2)
    paddle_r_position = consumer.c_paddleR.get(consumer.match_id, (game.canvas_height - game.paddle_height) // 2)
    score_player_1 = consumer.c_scorep1.get(consumer.match_id, 0)
    score_player_2 = consumer.c_scorep2.get(consumer.match_id, 0)
    
    ball_speed = consumer.c_ball_speed.get(consumer.match_id, 4)

    # Utiliser les dimensions dynamiques
    CANVAS_WIDTH = game.canvas_width
    CANVAS_HEIGHT = game.canvas_height
    PADDLE_WIDTH = game.paddle_width
    PADDLE_HEIGHT = game.paddle_height
    BALL_RADIUS = game.ball_radius

    # Mettre à jour la position de la balle
    ball_x += ball_dx * ball_speed
    ball_y += ball_dy * ball_speed

    # Collision avec les bords supérieur et inférieur
    if ball_y <= BALL_RADIUS or ball_y >= CANVAS_HEIGHT - BALL_RADIUS:
        ball_dy = -ball_dy
        # Légère variation aléatoire sur l'angle de rebond horizontal
        variation = random.uniform(-0.1, 0.1)
        # S'assurer que ball_dx ne devient pas trop petit
        if abs(ball_dx + variation) > 0.2:
            ball_dx += variation
        # Normaliser le vecteur pour maintenir la vitesse constante
        length = math.sqrt(ball_dx**2 + ball_dy**2)
        ball_dx /= length
        ball_dy /= length

    # Collision avec les raquettes
    if (ball_x <= PADDLE_WIDTH + BALL_RADIUS and
        paddle_l_position <= ball_y <= paddle_l_position + PADDLE_HEIGHT):
        ball_dx = -ball_dx
        # Calculer où la balle a frappé la raquette (de 0 à 1)
        relative_intersect_y = (ball_y - paddle_l_position) / PADDLE_HEIGHT
        # Convertir en angle entre -30 et 30 degrés
        bounce_angle = relative_intersect_y * 60 - 30
        # Ajouter un peu d'aléatoire à l'angle
        bounce_angle += random.uniform(-5, 5)
        # Convertir en radians
        bounce_angle_rad = math.radians(bounce_angle)
        # Calculer la nouvelle direction
        ball_dx = math.cos(bounce_angle_rad)
        ball_dy = -math.sin(bounce_angle_rad)
        ball_speed += 5
        
    elif (ball_x >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_RADIUS and
          paddle_r_position <= ball_y <= paddle_r_position + PADDLE_HEIGHT):
        ball_dx = -ball_dx
        # Calculer où la balle a frappé la raquette (de 0 à 1)
        relative_intersect_y = (ball_y - paddle_r_position) / PADDLE_HEIGHT
        # Convertir en angle entre -30 et 30 degrés
        bounce_angle = relative_intersect_y * 60 - 30
        # Ajouter un peu d'aléatoire à l'angle
        bounce_angle += random.uniform(-5, 5)
        # Convertir en radians
        bounce_angle_rad = math.radians(bounce_angle)
        # Calculer la nouvelle direction
        ball_dx = -math.cos(bounce_angle_rad)
        ball_dy = -math.sin(bounce_angle_rad)
        ball_speed += 5

    # Balle sort du terrain (point marqué)
    if ball_x < 0 or ball_x > CANVAS_WIDTH:
        ball_speed = 4
        if ball_x > CANVAS_WIDTH:
            score_player_1 += 1
        elif ball_x < 0:
            score_player_2 += 1

        # Réinitialiser la position et la direction de la balle
        ball_x = CANVAS_WIDTH // 2
        ball_y = CANVAS_HEIGHT // 2
        ball_dx = random.choice([1, -1])
        ball_dy = random.choice([0.2, -0.2, 0])

    # Mettre à jour les variables temporaires
    consumer.c_ballx[consumer.match_id] = ball_x
    consumer.c_bally[consumer.match_id] = ball_y
    consumer.c_balldx[consumer.match_id] = ball_dx
    consumer.c_balldy[consumer.match_id] = ball_dy
    consumer.c_ball_speed[consumer.match_id] = ball_speed
    consumer.c_scorep1[consumer.match_id] = score_player_1
    consumer.c_scorep2[consumer.match_id] = score_player_2

    # Sauvegarder l'état
    await consumer.save_game_state()
