import asyncio
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from core.pong import game_pong
from shared_models.models import Player, Match
from .models import Match, Player, StatusChoices, Game

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if user.is_anonymous:
            await self.close(code=4444)
            return

        player = await database_sync_to_async(Player.objects.get)(user=user)
        self.player_id = player.id
        self.group_name = f"user_{self.player_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name') and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def invitation_received(self, event):
        await self.send(text_data=json.dumps({
            "type": "invitation_received",
            "invitation_id": event["invitation_id"],
            "from_player": event["from_player"],
            "number_of_rounds": event["number_of_rounds"],
            "max_score_per_round": event["max_score_per_round"],
            "match_type": event["match_type"]
        }))

    async def match_created(self, event):
        await self.send(text_data=json.dumps({
            "type": "match_created",
            "match_id": event["match_id"],
            "player_1": event["player_1"],
            "player_2": event["player_2"],
            "number_of_rounds": event["number_of_rounds"],
            "match_type": event["match_type"],
            "ws_url": f"ws://localhost:8002/ws/pong/match/{event['match_id']}/"
        }))

    async def invitation_declined(self, event):
        await self.send(text_data=json.dumps({
            "type": "invitation_declined",
            "invitation_id": event["invitation_id"],
            "to_player": event["to_player"]
        }))

    async def game_updated(self, event):
        await self.send(text_data=json.dumps({
            "type": "game_updated",
            "match_id": event["match_id"],
            "game_id": event["game_id"],
            "score_player_1": event["score_player_1"],
            "score_player_2": event["score_player_2"],
            "status": event["status"],
            "winner": event["winner"],
            "match_status": event["match_status"],
            "match_winner": event["match_winner"]
        }))

    async def tournament_ready(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_ready",
            "tournament_id": event["tournament_id"],
            "name": event["name"],
        }))

    async def tournament_started(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_started",
            "tournament_id": event["tournament_id"],
            "name": event["name"],
        }))

    async def player_joined(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_joined",
            "tournament_id": event["tournament_id"],
            "name": event["name"],
            "joined_player": event["joined_player"],
        }))

    async def tournament_ended(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_ended",
            "tournament_id": event["tournament_id"],
            "name": event["name"],
            "winner": event["winner"],
        }))

    async def tournament_cancelled(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_cancelled",
            "tournament_id": event["tournament_id"],
            "name": event["name"],
        }))

    async def player_leave(self, event):
        await self.send(text_data=json.dumps({
            "type": "player_leave",
            "tournament_id": event["tournament_id"],
            "name": event["name"],
            "leaved_player": event["leaved_player"]
        }))



class PongConsumer(AsyncWebsocketConsumer):
    # Variables de classe pour stocker l'état du jeu et les tâches
    c_paddleL = {}  # Position de la raquette gauche par match_id
    c_paddleR = {}  # Position de la raquette droite par match_id
    c_ballx = {}    # Position x de la balle par match_id
    c_bally = {}    # Position y de la balle par match_id
    c_balldx = {}   # Vélocité x de la balle par match_id
    c_balldy = {}   # Vélocité y de la balle par match_id
    c_ball_speed = {}   # Vitesse de la balle par match_id
    c_scorep1 = {}  # Score du joueur 1 par match_id
    c_scorep2 = {}  # Score du joueur 2 par match_id
    c_status = {}   # Statut de la partie par match_id
    c_players = {}  # Joueurs connectés par match_id (set de player_id)
    c_game_wins = {}  # Victoires par joueur par match_id {match_id: {player_1_id: wins, player_2_id: wins}}
    c_current_game_id = {}  # ID de la Game en cours par match_id
    game_tasks = {} # Tâches game_pong par match_id
    task_locks = {} # Verrous pour la création des tâches par match_id

    @database_sync_to_async
    def get_active_game(self, match_id):
        """Récupère la partie active (EN_COURS) pour un match_id donné."""
        try:
            return Game.objects.select_related('player_1', 'player_2', 'match').filter(
                match__id=match_id, status=StatusChoices.EN_COURS
            ).first()
        except Game.DoesNotExist:
            return None

    @database_sync_to_async
    def get_game(self, game_id):
        """Récupère une partie par son ID."""
        try:
            return Game.objects.select_related('player_1', 'player_2').get(id=game_id)
        except Game.DoesNotExist:
            return None

    @database_sync_to_async
    def get_match(self, match_id):
        """Récupère un match par son ID."""
        try:
            return Match.objects.select_related('player_1', 'player_2').get(id=match_id)
        except Match.DoesNotExist:
            return None

    @database_sync_to_async
    def save_game_state(self):
        """Sauvegarde l'état de la partie dans la base de données."""
        if not hasattr(self, 'game') or not self.game:
            return
        if not hasattr(self, 'match_id') or self.match_id not in self.c_ballx:
            return
        try:
            self.game.ball_position = {'x': self.c_ballx.get(self.match_id, 0), 'y': self.c_bally.get(self.match_id, 0)}
            self.game.paddle_position = {
                'paddle_l': self.c_paddleL.get(self.match_id, 0),
                'paddle_r': self.c_paddleR.get(self.match_id, 0)
            }
            self.game.ball_dx = self.c_balldx.get(self.match_id, 0)
            self.game.ball_dy = self.c_balldy.get(self.match_id, 0)
            self.game.ball_speed = self.c_ball_speed.get(self.match_id, 4)
            self.game.score_player_1 = self.c_scorep1.get(self.match_id, 0)
            self.game.score_player_2 = self.c_scorep2.get(self.match_id, 0)
            self.game.status = self.c_status.get(self.match_id, StatusChoices.EN_COURS)
            self.game.save()
        except Exception as e:
            print(f"Error saving game state for match {self.match_id}: {str(e)}")


    async def handle_game_end(self, game, winner_id):
        """Gère la fin d'un jeu et détermine si le match est terminé ou s'il faut lancer un nouveau jeu."""
        # Envoyer l'événement de fin de jeu actuel
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_ended",
                "game_id": game.id,
                "winner": winner_id,
                "scorePlayer1": self.c_scorep1[self.match_id],
                "scorePlayer2": self.c_scorep2[self.match_id]
            }
        )
        
        # Mettre à jour le jeu terminé
        game_end_result = await self.end_game(game, winner_id)
        
        # Note: end_game ne retourne plus d'événement mais seulement le statut du match
        match_status = game_end_result.get("status")
        
        if match_status == "continue":
            # Créer un nouvel événement de jeu
            new_game_event = {
                "type": "new_game",
                "game_id": self.c_current_game_id[self.match_id],
                "round_number": self.game.round_number,
                "x": self.c_ballx[self.match_id],
                "y": self.c_bally[self.match_id],
                "paddleL": self.c_paddleL[self.match_id],
                "paddleR": self.c_paddleR[self.match_id],
                "scorePlayer1": self.c_scorep1[self.match_id],
                "scorePlayer2": self.c_scorep2[self.match_id]
            }
            await self.channel_layer.group_send(self.room_group_name, new_game_event)
            return new_game_event
        elif match_status == "ended":
            # Terminer le match
            match_result = await self.end_match(self.match)
            match_ended_event = {
                "type": "match_ended",
                "winner": match_result.get("winner"),
                "player_1_wins": match_result.get("player_1_wins"),
                "player_2_wins": match_result.get("player_2_wins")
            }
            await self.channel_layer.group_send(self.room_group_name, match_ended_event)
            return match_ended_event
        
    
    @database_sync_to_async
    def end_game(self, game, winner_id):
        """Met fin à une partie, met à jour le gagnant, et prépare une nouvelle partie si nécessaire."""
        try:
            # Mettre à jour la partie actuelle
            game.status = StatusChoices.TERMINE
            self.c_status[self.match_id] = StatusChoices.TERMINE
            game.score_player_1 = self.c_scorep1.get(self.match_id, 0)
            game.score_player_2 = self.c_scorep2.get(self.match_id, 0)
            if winner_id:
                game.winner = Player.objects.get(id=winner_id)
            game.save()

            # Mettre à jour les victoires
            if winner_id:
                self.c_game_wins[self.match_id][winner_id] += 1

            # Récupérer le match
            match = Match.objects.get(id=self.match_id)

            # Vérifier si d'autres rounds restent
            current_round = game.round_number
            if current_round < match.number_of_rounds:
                # Créer une nouvelle partie
                new_game = Game.objects.create(
                    match=match,
                    player_1=match.player_1,
                    player_2=match.player_2,
                    status=StatusChoices.EN_COURS,
                    ball_position={"x": match.games.first().canvas_width // 2, "y": match.games.first().canvas_height // 2},
                    paddle_position={
                        "paddle_l": (match.games.first().canvas_height - match.games.first().paddle_height) // 2,
                        "paddle_r": (match.games.first().canvas_height - match.games.first().paddle_height) // 2
                    },
                    round_number=current_round + 1,
                    max_score=game.max_score,
                    canvas_width=game.canvas_width,
                    canvas_height=game.canvas_height,
                    paddle_width=game.paddle_width,
                    paddle_height=game.paddle_height,
                    ball_radius=game.ball_radius
                )
                new_game.initialize_ball_direction()
                new_game.save()

                # Mettre à jour l'état
                self.game = new_game
                self.c_current_game_id[self.match_id] = new_game.id
                self.c_ballx[self.match_id] = new_game.ball_position['x']
                self.c_bally[self.match_id] = new_game.ball_position['y']
                self.c_paddleL[self.match_id] = new_game.paddle_position['paddle_l']
                self.c_paddleR[self.match_id] = new_game.paddle_position['paddle_r']
                self.c_balldx[self.match_id] = new_game.ball_dx
                self.c_balldy[self.match_id] = new_game.ball_dy
                self.c_ball_speed[self.match_id] = new_game.ball_speed
                self.c_scorep1[self.match_id] = 0
                self.c_scorep2[self.match_id] = 0
                self.c_status[self.match_id] = StatusChoices.EN_COURS

                return {"status": "continue"}
            else:
                return {"status": "ended"}
        except Exception as e:
            print(f"Error ending game for match {self.match_id}: {str(e)}")
            return {"status": "error", "error": str(e)}

    @database_sync_to_async
    def end_match(self, match):
        """Met fin au match et déclare le gagnant."""
        try:
            match.status = StatusChoices.TERMINE
            wins = self.c_game_wins[self.match_id]
            player_1_wins = wins.get(match.player_1_id, 0)
            player_2_wins = wins.get(match.player_2_id, 0)
            if player_1_wins > player_2_wins:
                match.winner = match.player_1
            elif player_2_wins > player_1_wins:
                match.winner = match.player_2
            match.save()

            # Retourner les données, pas un événement
            return {
                "winner": match.winner.user.username if match.winner else None,
                "player_1_wins": player_1_wins,
                "player_2_wins": player_2_wins
            }
        except Exception as e:
            print(f"Error ending match {self.match_id}: {str(e)}")
            return {"error": str(e)}

    async def connect(self):
        """Gère la connexion d'un joueur au WebSocket."""
        # Vérifier l'authentification
        if self.scope['user'].is_anonymous or self.scope['player_id'] is None:
            await self.close()
            return

        self.player_id = self.scope['player_id']
        self.match_id = self.scope['url_route']['kwargs']['match_id']
        self.room_group_name = f"pong_room_{self.match_id}"

        # Récupérer le match
        self.match = await self.get_match(self.match_id)
        if not self.match:
            await self.close()
            return

        # Récupérer la partie active
        self.game = await self.get_active_game(self.match_id)
        if not self.game:
            await self.close()
            return

        # Vérifier que le joueur est autorisé
        if self.player_id not in [self.game.player_1_id, self.game.player_2_id]:
            await self.close()
            return

        # Vérifier le nombre de joueurs connectés
        if self.match_id not in self.c_players:
            self.c_players[self.match_id] = set()
        if len(self.c_players[self.match_id]) >= 2:
            await self.close()
            return

        # Ajouter le joueur à la liste des connectés
        self.c_players[self.match_id].add(self.player_id)
        # Ajouter au groupe WebSocket et accepter la connexion
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Initialiser les variables temporaires
        self.c_ballx[self.match_id] = self.game.ball_position.get('x', self.game.canvas_width // 2)
        self.c_bally[self.match_id] = self.game.ball_position.get('y', self.game.canvas_height // 2)
        self.c_paddleL[self.match_id] = self.game.paddle_position.get('paddle_l', (self.game.canvas_height - self.game.paddle_height) // 2)
        self.c_paddleR[self.match_id] = self.game.paddle_position.get('paddle_r', (self.game.canvas_height - self.game.paddle_height) // 2)
        self.c_balldx[self.match_id] = self.game.ball_dx or 1
        self.c_balldy[self.match_id] = self.game.ball_dy or 0
        self.c_ball_speed[self.match_id] = self.game.ball_speed
        self.c_scorep1[self.match_id] = self.game.score_player_1
        self.c_scorep2[self.match_id] = self.game.score_player_2
        self.c_status[self.match_id] = self.game.status
        self.c_current_game_id[self.match_id] = self.game.id
        if self.match_id not in self.c_game_wins:
            self.c_game_wins[self.match_id] = {self.game.player_1_id: 0, self.game.player_2_id: 0}

        # Créer ou reprendre la tâche du jeu si les deux joueurs sont connectés
        if self.match_id not in self.task_locks:
            self.task_locks[self.match_id] = asyncio.Lock()
        async with self.task_locks[self.match_id]:
            if len(self.c_players[self.match_id]) == 2 and self.match_id not in self.game_tasks:
                self.game_tasks[self.match_id] = asyncio.create_task(self.run_game_loop())
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_resumed",
                        "message": "Le jeu reprend"
                    }
                )

        # Envoyer le nombre de joueurs connectés
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "player_count_update",
                "player_count": len(self.c_players[self.match_id])
            }
        )

        self.running = True
        self.periodic_task = asyncio.create_task(self.send_periodic_data())

    async def disconnect(self, close_code):
        """Gère la déconnexion d'un joueur."""
        self.running = False
        if hasattr(self, 'periodic_task'):
            self.periodic_task.cancel()

        if hasattr(self, 'room_group_name') and hasattr(self, 'channel_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        await self.save_game_state()

        if hasattr(self, 'match_id') and hasattr(self, 'player_id'):
            if self.match_id in self.c_players:
                self.c_players[self.match_id].discard(self.player_id)

                # Envoyer le nombre de joueurs connectés
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "player_count_update",
                        "player_count": len(self.c_players.get(self.match_id, set()))
                    }
                )

                # Mettre en pause si un joueur reste
                if len(self.c_players[self.match_id]) == 1 and self.match_id in self.game_tasks:
                    self.game_tasks[self.match_id].cancel()
                    del self.game_tasks[self.match_id]
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "game_paused",
                            "message": "Jeu en pause : un joueur s'est déconnecté"
                        }
                    )
                # Nettoyer si aucun joueur n'est connecté
                elif len(self.c_players[self.match_id]) == 0:
                    if self.match_id in self.game_tasks:
                        self.game_tasks[self.match_id].cancel()
                        del self.game_tasks[self.match_id]
                    if self.match_id in self.task_locks:
                        del self.task_locks[self.match_id]
                    if self.match_id in self.c_ballx:
                        del self.c_ballx[self.match_id]
                        del self.c_bally[self.match_id]
                        del self.c_paddleL[self.match_id]
                        del self.c_paddleR[self.match_id]
                        del self.c_balldx[self.match_id]
                        del self.c_balldy[self.match_id]
                        del self.c_ball_speed[self.match_id]
                        del self.c_scorep1[self.match_id]
                        del self.c_scorep2[self.match_id]
                        del self.c_status[self.match_id]
                        del self.c_game_wins[self.match_id]
                        del self.c_current_game_id[self.match_id]


    @database_sync_to_async
    def get_winner_username(game, winner_id):
        """Récupère le nom d'utilisateur du gagnant de manière asynchrone."""
        if not winner_id:
            return None
        if winner_id == game.player_1_id:
            return game.player_1.user.username
        return game.player_2.user.username

    async def run_game_loop(self):
        """Exécute game_pong dans une tâche unique pour un match."""
        while True:
            # Vérifier si la partie est en cours et si les deux joueurs sont connectés
            if self.c_status.get(self.match_id) != StatusChoices.EN_COURS or len(self.c_players.get(self.match_id, set())) != 2:
                self.game = await self.get_active_game(self.match_id)
                if not self.game:
                    break
                if len(self.c_players.get(self.match_id, set())) != 2:
                    break
            try:
                await game_pong(self.game.id, self)
                if self.c_scorep1.get(self.match_id, 0) >= self.game.max_score or self.c_scorep2.get(self.match_id, 0) >= self.game.max_score:
                    winner_id = None
                    if self.c_scorep1[self.match_id] >= self.game.max_score:
                        winner_id = self.game.player_1_id
                    elif self.c_scorep2[self.match_id] >= self.game.max_score:
                        winner_id = self.game.player_2_id
                    
                    # Utiliser la nouvelle méthode pour gérer la fin du jeu
                    await self.handle_game_end(self.game, winner_id)
                    break
            except Exception as e:
                print(f"Error in game loop for match {self.match_id}: {str(e)}")
                raise
            await asyncio.sleep(1 / 60)

    async def send_periodic_data(self):
        while self.running:
            if self.c_status.get(self.match_id) != StatusChoices.EN_COURS:
                        self.game = await self.get_active_game(self.match_id)
                        if not self.game:
                            await self.handle_match_end()
                            return
            try:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_update",
                        "x": self.c_ballx.get(self.match_id, 0),
                        "y": self.c_bally.get(self.match_id, 0),
                        "paddleL": self.c_paddleL.get(self.match_id, 0),
                        "paddleR": self.c_paddleR.get(self.match_id, 0),
                        "scorePlayer1": self.c_scorep1.get(self.match_id, 0),
                        "scorePlayer2": self.c_scorep2.get(self.match_id, 0),
                    }
                )
            except Exception as e:
                print(f"Error in send_periodic_data for match {self.match_id}: {str(e)}")
                break
            await asyncio.sleep(1 / 60)  # 120 Hz

    async def player_count_update(self, event):
        """Envoie le nombre de joueurs connectés aux clients."""
        await self.send(text_data=json.dumps({
            "type": "player_count",
            "player_count": event["player_count"]
        }))

    async def game_update(self, event):
        """Envoie les mises à jour du jeu aux clients."""
        await self.send(text_data=json.dumps({
            "type": "data_pong",
            "x": event["x"],
            "y": event["y"],
            "paddleL": event["paddleL"],
            "paddleR": event["paddleR"],
            "scorePlayer1": event["scorePlayer1"],
            "scorePlayer2": event["scorePlayer2"],
        }))

    async def game_paused(self, event):
        """Informe les clients que le jeu est en pause."""
        await self.send(text_data=json.dumps({
            "type": "game_paused",
            "message": event["message"]
        }))

    async def game_resumed(self, event):
        """Informe les clients que le jeu reprend."""
        await self.send(text_data=json.dumps({
            "type": "game_resumed",
            "message": event["message"]
        }))

    async def game_ended(self, event):
        try:
            await self.send(text_data=json.dumps({
                "type": "game_ended",
                "game_id": event["game_id"],
                "winner": event["winner"],
                "scorePlayer1": event["scorePlayer1"],
                "scorePlayer2": event["scorePlayer2"]
            }))
        except Exception as e:
            print(f"Failed to send game_ended event to client: {str(e)}")

    async def new_game(self, event):
        """Informe les clients qu'une nouvelle partie commence."""
        await self.send(text_data=json.dumps({
            "type": "new_game",
            "game_id": event["game_id"],
            "round_number": event["round_number"],
            "x": event["x"],
            "y": event["y"],
            "paddleL": event["paddleL"],
            "paddleR": event["paddleR"],
            "scorePlayer1": event["scorePlayer1"],
            "scorePlayer2": event["scorePlayer2"]
        }))

    async def match_ended(self, event):
        """Informe les clients que le match est terminé."""
        await self.send(text_data=json.dumps({
            "type": "match_ended",
            "winner": event["winner"],
            "player_1_wins": event["player_1_wins"],
            "player_2_wins": event["player_2_wins"]
        }))

    async def handle_match_end(self):
        try:
            # Envoyer un message de fin de match
            await self.send(text_data=json.dumps({"type": "game_over", "message": "Match terminé"}))
            
            # Vérifier si un événement match_ended doit être envoyé
            if self.match_id in self.c_game_wins:
                match_result = await self.end_match(self.match)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "match_ended",
                        "winner": match_result.get("winner"),
                        "player_1_wins": match_result.get("player_1_wins"),
                        "player_2_wins": match_result.get("player_2_wins")
                    }
                )
                # Attendre que les messages soient propagés
                await asyncio.sleep(0.1)
        except Exception as e:
            print(f"Error in handle_match_end: {str(e)}")
        finally:
            # Fermer la connexion après avoir envoyé tous les messages
            await self.close()
            
    async def receive(self, text_data):
        """Gère les messages reçus des clients (mouvements des raquettes, dimensions)."""
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        move = text_data_json.get('type')

        if action == 'set_dimensions':
            self.game.canvas_width = text_data_json.get('canvas_width', self.game.canvas_width)
            self.game.canvas_height = text_data_json.get('canvas_height', self.game.canvas_height)
            self.game.paddle_width = text_data_json.get('paddle_width', self.game.paddle_width)
            self.game.paddle_height = text_data_json.get('paddle_height', self.game.paddle_height)
            self.game.ball_radius = text_data_json.get('ball_radius', self.game.ball_radius)
            await self.save_game_state()
            self.c_ballx[self.match_id] = self.game.canvas_width // 2
            self.c_bally[self.match_id] = self.game.canvas_height // 2
            paddle_center = (self.game.canvas_height - self.game.paddle_height) // 2
            self.c_paddleL[self.match_id] = paddle_center
            self.c_paddleR[self.match_id] = paddle_center
            return

        if action == 'move_up':
            if move == 'paddle_l' and self.player_id == self.game.player_1_id:
                new_position = self.c_paddleL[self.match_id] - 5
                self.c_paddleL[self.match_id] = max(0, new_position)
            elif move == 'paddle_r' and self.player_id == self.game.player_2_id:
                new_position = self.c_paddleR[self.match_id] - 5
                self.c_paddleR[self.match_id] = max(0, new_position)
        elif action == 'move_down':
            if move == 'paddle_l' and self.player_id == self.game.player_1_id:
                new_position = self.c_paddleL[self.match_id] + 5
                max_position = self.game.canvas_height - self.game.paddle_height
                self.c_paddleL[self.match_id] = min(max_position, new_position)
            elif move == 'paddle_r' and self.player_id == self.game.player_2_id:
                new_position = self.c_paddleR[self.match_id] + 5
                max_position = self.game.canvas_height - self.game.paddle_height
                self.c_paddleR[self.match_id] = min(max_position, new_position)
