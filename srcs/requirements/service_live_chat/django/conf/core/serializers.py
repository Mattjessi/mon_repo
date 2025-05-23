from rest_framework import serializers
from .models import PrivateMessage, GeneralMessage
from shared_models.models import Player, Block, Friendship

class GeneralMessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.id', read_only=True) 
    sender_name = serializers.CharField(source='sender.name', read_only=True)

    class Meta:
        model = GeneralMessage
        fields = ['id', 'content', 'timestamp', 'sender', 'sender_name']
        read_only_fields = ['id', 'timestamp', 'sender', 'sender_name']

    def validate(self, data):
        # Récupérer l'utilisateur authentifié (sender)
        user = self.context['request'].user

        # Récupérer le Player associé à l'utilisateur (sender)
        try:
            sender_player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 2001})  # Profil de joueur non trouvé

        # Ajouter le sender (Player) aux données validées
        data['sender'] = sender_player
        return data


class PrivateMessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.id', read_only=True) 
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    receiver = serializers.CharField(source='receiver.id', read_only=True) 
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)

    class Meta:
        model = PrivateMessage
        fields = ['id', 'content', 'timestamp', 'sender', 'receiver', 'sender_name', 'receiver_name']
        read_only_fields = ['id', 'timestamp', 'sender', 'receiver', 'sender_name', 'receiver_namee']

    def validate(self, data):
        # Récupérer l'utilisateur authentifié (sender)
        user = self.context['request'].user

        # Récupérer le Player associé à l'utilisateur (sender)
        try:
            sender_player = Player.objects.get(user=user)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 2002})  # Profil de joueur non trouvé

        # Récupérer le receiver_player_id à partir du contexte (passé par la vue depuis l'URL)
        receiver_player_id = self.context.get('receiver_player_id')
        if not receiver_player_id:
            raise serializers.ValidationError({"code": 2003})  # L'ID du joueur destinataire est requis

        # Récupérer le Player du destinataire
        try:
            receiver_player = Player.objects.get(id=receiver_player_id)
        except Player.DoesNotExist:
            raise serializers.ValidationError({"code": 2004})  # Joueur destinataire non trouvé

        # Vérifier si le sender et le receiver sont amis (Friendship avec status='accepted')
        friendship_exists = Friendship.objects.filter(
            status='accepted',
            player_1=sender_player,
            player_2=receiver_player
        ).exists() or Friendship.objects.filter(
            status='accepted',
            player_1=receiver_player,
            player_2=sender_player
        ).exists()

        if not friendship_exists:
            raise serializers.ValidationError({"code": 2005})  # Vous ne pouvez envoyer des messages qu'à vos amis

        # Vérifier si le sender et le receiver sont bloqués
        if Block.objects.filter(blocker=sender_player, blocked=receiver_player).exists():
            raise serializers.ValidationError({"code": 2006})  # Vous ne pouvez pas envoyer de message à un utilisateur que vous avez bloqué
        if Block.objects.filter(blocker=receiver_player, blocked=sender_player).exists():
            raise serializers.ValidationError({"code": 2007})  # Vous ne pouvez pas envoyer de message à un utilisateur qui vous a bloqué

        # Ajouter le sender (Player) et le receiver (Player) aux données validées
        data['sender'] = sender_player
        data['receiver'] = receiver_player
        return data
