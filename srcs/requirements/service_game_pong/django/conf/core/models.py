from django.db import models
import random
from shared_models.models import Player, Match

class StatusChoices(models.TextChoices):
    EN_ATTENTE = 'En attente'
    ACCEPTEE = 'Acceptée'
    REFUSEE = 'Refusée'
    EN_COURS = 'En cours'
    TERMINE = 'Terminée'
    ANNULEE  = 'Annulée'

class TypeChoices(models.TextChoices):
    IA = 'IA'
    NORMAL = 'Normal'
    TOURNAMENT = 'Tournois'

class TournamentStatusChoices(models.TextChoices):
    OUVERT = 'Ouvert'
    EN_COURS = 'En cours'
    TERMINE = 'Terminée'
    
class Invitation(models.Model):
    from_player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='sent_invitations')
    to_player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='received_invitations')
    number_of_rounds = models.PositiveIntegerField(default=1, null=True, blank=True)
    max_score_per_round = models.PositiveIntegerField(default=3, null=True, blank=True)
    status = models.CharField(choices=StatusChoices.choices, max_length=10, default=StatusChoices.EN_ATTENTE)
    match_type = models.CharField(choices=TypeChoices.choices, max_length=10, default=TypeChoices.NORMAL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invitation {self.id} from {self.from_player} to {self.to_player}"


class Game(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    match = models.ForeignKey(Match, on_delete=models.SET_NULL, related_name='games', null=True, blank=True)
    player_1 = models.ForeignKey(Player, on_delete=models.SET_NULL, related_name='games_as_player_1', null=True, blank=True)
    player_2 = models.ForeignKey(Player, on_delete=models.SET_NULL, related_name='games_as_player_2', null=True, blank=True)
    score_player_1 = models.PositiveIntegerField(default=0)
    score_player_2 = models.PositiveIntegerField(default=0)
    date_played = models.DateTimeField(auto_now_add=True)
    status = models.CharField(choices=StatusChoices.choices, max_length=10, default=StatusChoices.EN_COURS)
    ball_position = models.JSONField(default=dict, null=True, blank=True)
    paddle_position = models.JSONField(default=dict, null=True, blank=True)
    ball_dx = models.IntegerField(default=1)
    ball_dy = models.IntegerField(default=0)
    ball_speed = models.FloatField(default=4)
    round_number = models.PositiveIntegerField(null=True, blank=True)
    winner = models.ForeignKey(Player, on_delete=models.SET_NULL, related_name='won_games', null=True, blank=True)
    max_score = models.PositiveIntegerField(default=3 ,null=True, blank=True)
    # custom info
    canvas_width = models.PositiveIntegerField(default=800)
    canvas_height = models.PositiveIntegerField(default=400)
    paddle_width = models.PositiveIntegerField(default=10)
    paddle_height = models.PositiveIntegerField(default=80)
    ball_radius = models.PositiveIntegerField(default=10)

    def initialize_ball_direction(self):
        self.ball_dx = random.choice([1, -1])
        self.ball_dy = random.choice([1, -1, 0])
        self.save()

    def __str__(self):
        return f"Game {self.id} (Round {self.round_number}) in Match {self.match.id if self.match else 'N/A'}"
