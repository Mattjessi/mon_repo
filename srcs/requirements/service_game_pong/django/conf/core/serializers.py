from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from django.urls import reverse
from rest_framework import generics, permissions, serializers
from core.models import Game, Invitation, StatusChoices, TournamentStatusChoices, TypeChoices
from shared_models.models import Player, Block, Match, Tournament

class PongPlayerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Player
        fields = ['id', 'username']

class PongGameSerializer(serializers.ModelSerializer):
    player_1 = PongPlayerSerializer(read_only=True)
    player_2 = PongPlayerSerializer(read_only=True)
    winner = PongPlayerSerializer(read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = ['id', 'url', 'round_number', 'player_1', 'player_2', 'score_player_1', 'score_player_2', 'status', 'ball_position', 'paddle_position', 'max_score', 'winner']

    def get_url(self, obj):
        request = self.context.get('request')
        return reverse('game-detail', args=[obj.match.id, obj.id], request=request)

class PongMatchSerializer(serializers.ModelSerializer):
    player_1 = PongPlayerSerializer(read_only=True)
    player_2 = PongPlayerSerializer(read_only=True)
    winner = PongPlayerSerializer(read_only=True)
    games = PongGameSerializer(many=True, read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = ['id', 'url', 'status', 'number_of_rounds', 'type', 'player_1', 'player_2', 'winner', 'games', 'tournament', 'number_of_rounds']

    def get_url(self, obj):
        request = self.context.get('request')
        return reverse('match-detail', args=[obj.id], request=request)

class PongInvitationSerializer(serializers.ModelSerializer):
    from_player = PongPlayerSerializer(read_only=True)
    to_player = PongPlayerSerializer(read_only=True)
    player_2_id = serializers.IntegerField(write_only=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Invitation
        fields = [
            'id', 'from_player', 'to_player', 'player_2_id',
            'number_of_rounds', 'max_score_per_round', 'match_type',
            'status', 'created_at', 'updated_at'
        ]

    def validate(self, attrs):
        # Récupérer l'utilisateur connecté et son profil joueur
        user = self.context['request'].user
        try:
            from_player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Pas de profil joueur

        # Récupérer les données envoyées
        player_2_id = attrs.get('player_2_id')
        number_of_rounds = attrs.get('number_of_rounds')
        max_score_per_round = attrs.get('max_score_per_round')
        match_type = attrs.get('match_type', TypeChoices.NORMAL)

        # Vérifications des champs requis
        if not player_2_id:
            raise serializers.ValidationError({"code": 4002})  # ID du joueur 2 requis

        # Vérifier l'existence du joueur 2
        try:
            to_player = Player.objects.get(id=player_2_id)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4004})  # Joueur 2 introuvable

        # Vérifier que les joueurs sont différents
        if from_player == to_player:
            raise serializers.ValidationError({"code": 4005})  # Joueurs identiques

        # Valider le nombre de manches (si fourni, doit être impair et entre 1 et 5)
        if number_of_rounds is not None:
            try:
                number_of_rounds = int(number_of_rounds)
                if number_of_rounds < 1 or number_of_rounds > 5 or number_of_rounds % 2 == 0:
                    raise ValueError
            except (ValueError, TypeError):
                raise serializers.ValidationError({"code": 4014})  # Nombre de manches doit être impair
        # Si number_of_rounds n'est pas fourni, le modèle utilisera la valeur par défaut

        # Valider le score maximum par manche (si fourni, doit être impair et positif)
        if max_score_per_round is not None:
            try:
                max_score_per_round = int(max_score_per_round)
                if max_score_per_round < 1 or max_score_per_round % 2 == 0:
                    raise ValueError
            except (ValueError, TypeError):
                raise serializers.ValidationError({"code": 4013})  # Score max doit être impair

        # Valider le type de match
        if match_type not in [choice[0] for choice in TypeChoices.choices]:
            raise serializers.ValidationError({"code": 4008})  # Type de match invalide
        
        # Vérifier si une invitation en attente existe pour to_player
        if Invitation.objects.filter(to_player=to_player, status=StatusChoices.EN_ATTENTE).exists():
            raise serializers.ValidationError({"code": 4028})  # Invitation en attente existante

        # Vérifier les blocages
        if Block.objects.filter(blocker=to_player, blocked=from_player).exists():
            raise serializers.ValidationError({"code": 4026})  # Vous avez bloqué ce joueur
        if Block.objects.filter(blocker=from_player, blocked=to_player).exists():
            raise serializers.ValidationError({"code": 4027})  # Ce joueur vous a bloqué

        # Ajouter les données validées pour la création
        attrs['from_player'] = from_player
        attrs['to_player'] = to_player
        attrs['match_type'] = match_type
        return attrs

    def create(self, validated_data):
        # Supprimer player_2_id des données validées, car il est utilisé pour to_player
        validated_data.pop('player_2_id', None)
        # Définir le statut à EN_ATTENTE
        validated_data['status'] = StatusChoices.EN_ATTENTE
        # Créer l'invitation
        invitation = super().create(validated_data)

        # Envoyer une notification WebSocket au joueur destinataire
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{invitation.to_player.id}",
                {
                    "type": "invitation_received",
                    "invitation_id": invitation.id,
                    "from_player": invitation.from_player.user.username,
                    "number_of_rounds": invitation.number_of_rounds,
                    "max_score_per_round": invitation.max_score_per_round,
                    "match_type": invitation.match_type
                }
            )

        return invitation

class InvitationAcceptSerializer(serializers.Serializer):
    def validate(self, attrs):
        invitation = self.instance
        user = self.context['request'].user

        # Vérifier si l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Pas de profil joueur
    
        # Vérifier si le joueur est le destinataire de l'invitation
        if invitation.to_player != player:
            raise serializers.ValidationError({"code": 4010})  # Pas le destinataire
        
        from_player= player
        to_player=invitation.to_player
        
        if Tournament.objects.filter(
            Q(player_1__in=[from_player, to_player]) |
            Q(player_2__in=[from_player, to_player]) |
            Q(player_3__in=[from_player, to_player]) |
            Q(player_4__in=[from_player, to_player]),
            status__in=['OPEN', 'IN_PROGRESS']
        ).exists():
            raise serializers.ValidationError({"code": 4009})

        # Vérifier si l'invitation est en attente
        if invitation.status != StatusChoices.EN_ATTENTE:
            raise serializers.ValidationError({"code": 4011})  # Invitation non en attente

        attrs['player'] = player
        return attrs

    def update(self, instance, validated_data):
        # Mettre à jour l'invitation
        instance.status = StatusChoices.ACCEPTEE
        instance.save()

        # Créer le match
        match = Match.objects.create(
            player_1=instance.from_player,
            player_2=instance.to_player,
            number_of_rounds=instance.number_of_rounds,
            status=StatusChoices.EN_COURS,
            type=instance.match_type
        )

        # Créer le jeu
        game = Game.objects.create(
            match=match,
            player_1=match.player_1,
            player_2=match.player_2,
            status=StatusChoices.EN_COURS,
            ball_position={"x": 400, "y": 200},
            paddle_position={"paddle_l": 160, "paddle_r": 160},
            round_number=1,
            max_score=instance.max_score_per_round
        )
        game.initialize_ball_direction()
        game.save()

        # Annuler les autres invitations en attente du from_player
        other_invitations = Invitation.objects.filter(
            from_player=instance.from_player,
            status=StatusChoices.EN_ATTENTE
        ).exclude(id=instance.id)
        for inv in other_invitations:
            inv.status = StatusChoices.ANNULEE
            inv.save()

        # Notifier les deux joueurs via WebSocket
        channel_layer = get_channel_layer()
        for player_id in [instance.from_player.id, instance.to_player.id]:
            async_to_sync(channel_layer.group_send)(
                f"user_{player_id}",
                {
                    "type": "match_created",
                    "match_id": match.id,
                    "player_1": match.player_1.user.username,
                    "player_2": match.player_2.user.username,
                    "number_of_rounds": match.number_of_rounds,
                    "match_type": match.type
                }
            )

        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "match_id": Match.objects.get(player_1=instance.from_player, player_2=instance.to_player, status=StatusChoices.EN_COURS).id,
        }
    
class InvitationDeclineSerializer(serializers.Serializer):
    def validate(self, attrs):
        invitation = self.instance
        user = self.context['request'].user

        # Vérifier si l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Pas de profil joueur

        # Vérifier si le joueur est le destinitaire de l'invitation
        if invitation.to_player != player:
            raise serializers.ValidationError({"code": 4010})  # Pas le destinataire

        # Vérifier si l'invitation est en attente
        if invitation.status != StatusChoices.EN_ATTENTE:
            raise serializers.ValidationError({"code": 4011})  # Invitation non en attente

        attrs['player'] = player
        return attrs

    def update(self, instance, validated_data):
        # Mettre à jour l'invitation
        instance.status = StatusChoices.REFUSEE
        instance.save()

        # Notifier le joueur initiateur via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.from_player.id}",
            {
                "type": "invitation_declined",
                "invitation_id": instance.id,
                "to_player": instance.to_player.user.username
            }
        )

        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "invitation_id": instance.id,
        }

#-----------------------------------------------------------------#

class TournamentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50, required=False)
    max_score_per_round = serializers.IntegerField(default=3, min_value=1, max_value=9)
    number_of_rounds = serializers.IntegerField(default=3, min_value=1, max_value=9)

    def validate(self, attrs):
        user = self.context['request'].user
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Aucun profil joueur associé à l'utilisateur

        if attrs['max_score_per_round'] % 2 == 0:
            raise serializers.ValidationError({"code": 4013})  # Le score maximum par manche doit être impair

        if attrs['number_of_rounds'] % 2 == 0:
            raise serializers.ValidationError({"code": 4014})  # Le nombre de manches doit être impair

        if Tournament.objects.filter(
            Q(player_1=player) |
            Q(player_2=player) |
            Q(player_3=player) |
            Q(player_4=player),
            Q(status=TournamentStatusChoices.OUVERT) |
            Q(status=TournamentStatusChoices.EN_COURS)
        ).exists():
            raise serializers.ValidationError({"code": 4009})  # Joueur déjà dans un tournoi ouvert ou en cours

        attrs['player_1'] = player
        return attrs

    def create(self, validated_data):
        tournament = Tournament.objects.create(
            player_1=validated_data['player_1'],
            name=validated_data.get('name', ''),
            max_score_per_round=validated_data['max_score_per_round'],
            number_of_rounds=validated_data['number_of_rounds']
        )
        return tournament

    def to_representation(self, instance):
        return {
            "code": 1000,
            "tournament_id": instance.id,
            "name": instance.name,
            "status": instance.status
        }

class TournamentListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tournament
        fields = ['id', 'name', 'player_1', 'player_2', 'player_3', 'player_4', 'status', 'winner','max_score_per_round', 'number_of_rounds', 'created_at']


class TournamentMatchSerializer(serializers.ModelSerializer):
    player_1 = PongPlayerSerializer(read_only=True)
    player_2 = PongPlayerSerializer(read_only=True)
    winner   = PongPlayerSerializer(read_only=True)
    
    class Meta:
        model = Match
        fields = ['id', 'tournament', 'player_1', 'player_2', 
                 'number_of_rounds', 'winner','created_at', 'updated_at']


class TournamentJoinSerializer(serializers.Serializer):
    def validate(self, attrs):
        tournament = self.instance
        user = self.context['request'].user

        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Aucun profil joueur associé à l'utilisateur

        if Tournament.objects.filter(
            Q(player_1=player) | Q(player_2=player) | Q(player_3=player) | Q(player_4=player),
            Q(status=TournamentStatusChoices.OUVERT) | Q(status=TournamentStatusChoices.EN_COURS)
        ).exists():
            raise serializers.ValidationError({"code": 4009})  # Joueur déjà dans un tournoi ouvert ou en cours

        if tournament.player_4 is not None:
            raise serializers.ValidationError({"code": 4015})  # Tournoi plein

        if tournament.status != TournamentStatusChoices.OUVERT:
            raise serializers.ValidationError({"code": 4016})  # Tournoi non ouvert
        
        # Vérifier les blocages avec les joueurs du tournoi
        current_players = [
            tournament.player_1,
            tournament.player_2,
            tournament.player_3,
            tournament.player_4
        ]
        current_players = [p for p in current_players if p is not None]

        # Vérifier si le joueur a bloqué un participant
        if Block.objects.filter(blocker=player, blocked__in=current_players).exists():
            raise serializers.ValidationError({"code": 4026})  # Vous avez bloqué un joueur du tournoi

        # Vérifier si le joueur est bloqué par un participant
        if Block.objects.filter(blocker__in=current_players, blocked=player).exists():
            raise serializers.ValidationError({"code": 4027})  # Vous êtes bloqué par un joueur du tournoi

        attrs['player'] = player
        return attrs

    def update(self, instance, validated_data):
        player = validated_data['player']
        channel_layer = get_channel_layer()

        # Liste des joueurs actuels (non nuls) avant d'ajouter le nouveau
        current_players = [
            instance.player_1,
            instance.player_2,
            instance.player_3,
            instance.player_4
        ]
        current_players = [p for p in current_players if p is not None]

        # Ajouter le nouveau joueur
        if instance.player_2 is None:
            instance.player_2 = player
        elif instance.player_3 is None:
            instance.player_3 = player
        elif instance.player_4 is None:
            instance.player_4 = player

        # Notifier tous les joueurs actuels (y compris le nouveau joueur)
        players_to_notify = current_players + [player]
        for p in players_to_notify:
            group_name = f"user_{p.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "player_joined",
                    "tournament_id": instance.id,
                    "name": instance.name,
                    "joined_player": player.name,
                }
            )

        # Si le tournoi est plein, notifier le créateur
        if instance.player_4 is not None:
            group_name = f"user_{instance.player_1.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "tournament_ready",
                    "tournament_id": instance.id,
                    "name": instance.name,
                }
            )

        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "tournament_id": instance.id,
            "name": instance.name
        }

class TournamentStartSerializer(serializers.Serializer):
    def validate(self, attrs):
        tournament = self.instance
        user = self.context['request'].user

        # Vérifier que l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Aucun profil joueur associé à l'utilisateur

        # Vérifier que l'utilisateur est le créateur du tournoi (player_1)
        if tournament.player_1.user != user:
            raise serializers.ValidationError({"code": 4012})  # Utilisateur non autorisé à démarrer ce tournoi

        # Vérifier que le tournoi est en statut OUVERT
        if tournament.status != TournamentStatusChoices.OUVERT:
            raise serializers.ValidationError({"code": 4016})  # Tournoi non ouvert

        # Vérifier qu'il y a exactement 4 joueurs
        players = [
            tournament.player_1,
            tournament.player_2,
            tournament.player_3,
            tournament.player_4
        ]
        players = [p for p in players if p is not None]
        if len(players) != 4:
            raise serializers.ValidationError({"code": 4015})  # Tournoi doit avoir exactement 4 joueurs

        return attrs

    def calculate_win_rate(self, player):
        """Calcule le win rate d'un joueur (en pourcentage)."""
        total_games = player.victory + player.defeat
        if total_games == 0:
            return 0.0
        return (player.victory / total_games) * 100

    def pair_players(self, tournament):
        """Trie les joueurs par win rate et crée les paires pour les demi-finales."""
        players = [
            tournament.player_1,
            tournament.player_2,
            tournament.player_3,
            tournament.player_4
        ]
        players = [p for p in players if p is not None]

        # Trier les joueurs par win rate (du plus fort au plus faible)
        sorted_players = sorted(
            players,
            key=self.calculate_win_rate,
            reverse=True
        )

        # Créer les paires : 1er vs 4ème, 2ème vs 3ème
        return [
            (sorted_players[0], sorted_players[3]),  # Meilleur vs Pire
            (sorted_players[1], sorted_players[2])   # Deuxième meilleur vs Deuxième pire
        ]

    def update(self, instance, validated_data):
        """Démarre le tournoi en créant les matchs et mettant à jour le statut."""
        channel_layer = get_channel_layer()

        # Notifier tous les participants que le tournoi a commencé
        players = [
            instance.player_1,
            instance.player_2,
            instance.player_3,
            instance.player_4
        ]
        for player in players:
            group_name = f"user_{player.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "tournament_started",
                    "tournament_id": instance.id,
                    "name": instance.name,
                }
            )

        # Récupérer les paires de joueurs
        pairs = self.pair_players(instance)

        # Créer les deux matchs (demi-finales) et notifier les joueurs
        for i, (player_1, player_2) in enumerate(pairs, 1):
            match = Match.objects.create(
                tournament=instance,
                player_1=player_1,
                player_2=player_2,
                number_of_rounds=3,
                match_number=2,
                status=StatusChoices.EN_COURS,
                type=TypeChoices.TOURNAMENT,
            )
            game = Game.objects.create(
                match=match,
                player_1=match.player_1,
                player_2=match.player_2,
                status=StatusChoices.EN_COURS,
                round_number=1,
                max_score=instance.max_score_per_round
            )
            game.save()
            # Notifier les deux joueurs du match
            for player in [player_1, player_2]:
                group_name = f"user_{player.id}"
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        "type": "match_created",
                        "match_id": match.id,
                        "player_1": match.player_1.name,
                        "player_2": match.player_2.name,
                        "number_of_rounds": instance.number_of_rounds,
                        "max_score_per_round": instance.max_score_per_round,
                        "match_type": "tournament_semi_final",
                        "ws_url": f"ws://localhost:8002/ws/pong/match/{match.id}/",
                        "tournament_id": instance.id,
                        "tournament_name": instance.name
                    }
                )

        # Mettre à jour le statut du tournoi
        instance.status = TournamentStatusChoices.EN_COURS
        instance.save()

        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "tournament_id": instance.id,
            "name": instance.name,
            "status": instance.status,
        }

class TournamentStartFinalSerializer(serializers.Serializer):
    def validate(self, attrs):
        tournament = self.instance
        user = self.context['request'].user

        # Vérifier que l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Aucun profil joueur associé à l'utilisateur

        # Vérifier que le joueur est présent dans le tournoi
        if player not in [tournament.player_1, tournament.player_2, tournament.player_3, tournament.player_4]:
            raise serializers.ValidationError({"code": 4017})  # Seul un participant du tournoi peut démarrer la finale

        # Vérifier que le tournoi est en statut EN_COURS
        if tournament.status != TournamentStatusChoices.EN_COURS:
            raise serializers.ValidationError({"code": 4018})  # Tournoi doit être en cours pour lancer la finale

        # Vérifier que les demi-finales sont terminées
        demi_finales = Match.objects.filter(match_number=2, tournament=tournament)
        if demi_finales.count() != 2:
            raise serializers.ValidationError({"code": 4022})  # Tournoi doit avoir exactement deux matchs de demi-finales
        for match in demi_finales:
            if match.status != StatusChoices.TERMINE:
                raise serializers.ValidationError({"code": 4023})  # Tous les matchs des demi-finales doivent être terminés
            if not match.winner:
                raise serializers.ValidationError({"code": 4024})  # Tous les matchs des demi-finales doivent avoir un gagnant

        # Vérifier qu'il n'y a pas déjà une finale
        if Match.objects.filter(match_number=1, tournament=tournament).exists():
            raise serializers.ValidationError({"code": 4025})  # La finale a déjà été créée

        return attrs

    def update(self, instance, validated_data):
        # Récupérer les gagnants des demi-finales
        demi_finales = Match.objects.filter(match_number=2, tournament=instance)
        finalists = [match.winner for match in demi_finales]

        # Créer le match de la finale
        final_match = Match.objects.create(
            tournament=instance,
            match_number=1,
            player_1=finalists[0],
            player_2=finalists[1],
            number_of_rounds=3,
            status=StatusChoices.EN_COURS,
            type=TypeChoices.TOURNAMENT
        )

        game = Game.objects.create(
            match=final_match,
            player_1=final_match.player_1,
            player_2=final_match.player_2,
            status=StatusChoices.EN_COURS,
            round_number=1,
            max_score=instance.max_score_per_round
        )
        game.save()

        # Envoyer une notification WebSocket aux finalistes
        channel_layer = get_channel_layer()
        for player in finalists:
            group_name = f"user_{player.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "match_created",
                    "match_id": final_match.id,
                    "player_1": final_match.player_1.name,
                    "player_2": final_match.player_2.name,
                    "number_of_rounds": instance.number_of_rounds,
                    "max_score_per_round": instance.max_score_per_round,
                    "match_type": "tournament_final",
                    "ws_url": f"ws://localhost:8002/ws/pong/match/{final_match.id}/"
                }
            )

        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "tournament_id": instance.id,
            "name": instance.name,
            "status": instance.status,
        }



class TournamentEndSerializer(serializers.Serializer):
    def validate(self, attrs):
        tournament = self.instance
        user = self.context['request'].user

        # Vérifier que l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Aucun profil joueur associé à l'utilisateur

        # Vérifier que le joueur est présent dans le tournoi
        if player not in [tournament.player_1, tournament.player_2, tournament.player_3, tournament.player_4]:
            raise serializers.ValidationError({"code": 4017})  # Seul un participant du tournoi peut terminer le tournoi

        # Vérifier que le tournoi est en statut EN_COURS
        if tournament.status != TournamentStatusChoices.EN_COURS:
            raise serializers.ValidationError({"code": 4018})  # Tournoi doit être en cours pour être terminé

        # Vérifier que les matchs sont terminés
        matchs = Match.objects.filter(Q(match_number=2) | Q(match_number=3), tournament=tournament)
        if matchs.count() != 3:
            raise serializers.ValidationError({"code": 4019})  # Tournoi doit avoir exactement trois matchs
        for match in matchs:
            if match.status != StatusChoices.TERMINE:
                raise serializers.ValidationError({"code": 4020})  # Tous les matchs doivent être terminés
            if not match.winner:
                raise serializers.ValidationError({"code": 4021})  # Tous les matchs doivent avoir un gagnant

        return attrs

    def update(self, instance, validated_data):
        # Mettre à jour le statut du tournoi
        instance.status = TournamentStatusChoices.TERMINE
        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "tournament_id": instance.id,
            "name": instance.name,
            "status": instance.status,
        }
    

class TournamentLeaveSerializer(serializers.Serializer):
    def validate(self, attrs):
        tournament = self.instance
        user = self.context['request'].user

        # Vérifier si l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001})  # Aucun profil joueur associé à l'utilisateur

        # Vérifier si le joueur fait partie du tournoi
        if player not in [tournament.player_1, tournament.player_2, tournament.player_3, tournament.player_4]:
            raise serializers.ValidationError({"code": 4031})  # Vous ne faites pas partie de ce tournoi

        # Vérifier que le joueur n'est pas player_1
        if player == tournament.player_1:
            raise serializers.ValidationError({"code": 4032})  # Le joueur 1 ne peut pas quitter le tournoi

        # Vérifier si le joueur est déjà dans un autre tournoi ouvert ou en cours
        if Tournament.objects.filter(
            Q(player_1=player) | Q(player_2=player) | Q(player_3=player) | Q(player_4=player),
            Q(status=TournamentStatusChoices.OUVERT) | Q(status=TournamentStatusChoices.EN_COURS)
        ).exclude(id=tournament.id).exists():
            raise serializers.ValidationError({"code": 4009})  # Joueur déjà dans un tournoi ouvert ou en cours

        # Vérifier si le tournoi est ouvert
        if tournament.status != TournamentStatusChoices.OUVERT:
            raise serializers.ValidationError({"code": 4016})  # Tournoi a déjà démarré

        attrs['player'] = player
        return attrs

    def update(self, instance, validated_data):
        player = validated_data['player']
        channel_layer = get_channel_layer()

        # Liste des joueurs actuels (non nuls) avant de retirer le joueur
        current_players = [
            instance.player_1,
            instance.player_2,
            instance.player_3,
            instance.player_4
        ]
        current_players = [p for p in current_players if p is not None]

        # Retirer le joueur
        if instance.player_2 == player:
            instance.player_2 = None
        elif instance.player_3 == player:
            instance.player_3 = None
        elif instance.player_4 == player:
            instance.player_4 = None

        # Notifier tous les joueurs actuels (y compris le joueur qui quitte)
        players_to_notify = current_players
        for p in players_to_notify:
            group_name = f"user_{p.id}"
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    "type": "player_leave",
                    "tournament_id": instance.id,
                    "name": instance.name,
                    "leaved_player": player.name,
                }
            )
        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "code": 1000,
            "tournament_id": instance.id,
            "name": instance.name
        }

class TournamentCancelSerializer(serializers.Serializer):
    def validate(self, attrs):
        tournament = self.instance
        user = self.context['request'].user

        # Vérifier que l'utilisateur a un profil joueur
        try:
            player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 4001}) #Aucun profil joueur associé

        # Vérifier que le joueur est le créateur du tournoi
        if player != tournament.player_1:
            raise serializers.ValidationError({"code": 4012}) #Non autorisé à supprimer ce tournoi

        # Vérifier que le tournoi est en statut OUVERT
        if tournament.status != TournamentStatusChoices.OUVERT:
            raise serializers.ValidationError({"code": 4028}) #Tournoi non supprimable (pas en statut ouvert)

        return attrs
