from django.db.models.signals import post_save
from django.dispatch import receiver
from shared_models.models import Match, Tournament, TournamentStatusChoices, StatusChoices
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=Match)
def handle_final_match_completion(sender, instance, **kwargs):
    """
    Signal déclenché lorsqu'un match est sauvegardé.
    Si le match est une finale (match_number=1), terminé, et a un gagnant,
    met à jour le tournoi à TERMINE et notifie les joueurs.
    """
    try:
        # Vérifier si le match est une finale terminée avec un gagnant
        if instance.match_number == 1 and instance.status == StatusChoices.TERMINE and instance.winner:
            tournament = instance.tournament
            print(tournament)
            # Vérifier que le tournoi est en cours
            if tournament.status == TournamentStatusChoices.EN_COURS:
                # Mettre à jour le tournoi
                tournament.status = TournamentStatusChoices.TERMINE
                tournament.winner = instance.winner
                tournament.save()

                # Notifier les joueurs via WebSocket
                channel_layer = get_channel_layer()
                players = [
                    tournament.player_1,
                    tournament.player_2,
                    tournament.player_3,
                    tournament.player_4
                ]
                players = [p for p in players if p is not None]  # Filtrer les joueurs non nuls

                for player in players:
                    group_name = f"user_{player.id}"
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            "type": "tournament_ended",
                            "tournament_id": tournament.id,
                            "name": tournament.name,
                            "winner": tournament.winner.name,
                        }
                    )
    except Exception as e:
        print(f"Erreur dans handle_final_match_completion pour match {instance.id}: {str(e)}")
