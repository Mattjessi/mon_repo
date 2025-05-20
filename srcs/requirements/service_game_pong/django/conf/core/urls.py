from django.urls import path
from . import views

urlpatterns = [
    path('invitations/', views.InvitationListAPI.as_view(), name='invitation-list'),
    path('invitations/create/', views.InvitationCreateAPI.as_view(), name='invitation-create'),
    path('invitations/<int:id>/accept/', views.InvitationAcceptAPI.as_view(), name='invitation-accept'),
    path('invitations/<int:id>/decline/', views.InvitationDeclineAPI.as_view(), name='invitation-decline'),
    path('matches/', views.MatchListAPI.as_view(), name='match-list'),
    path('matches/<int:id>/', views.MatchDetailAPI.as_view(), name='match-detail'),
    path('matches/<int:match_id>/games/<int:id>/', views.GameDetailAPI.as_view(), name='game-detail'),

    path('tournament/create/', views.TournamentCreateAPI.as_view(), name='tournament-create'),
    path('tournament/list/', views.TournamentOpenListAPI.as_view(), name='tournament-list'),
    path('tournament/history/<int:id>/', views.TournamentHistoryListAPI.as_view(), name='tournament-history'),
    path('tournament/<int:tournament_id>/games/', views.TournamentMatchListAPI.as_view(), name='tournament-games'),
    path('tournament/<int:id>/join/', views.TournamentJoinAPI.as_view(), name='tournament-join'),
    path('tournament/<int:id>/start/', views.TournamentStartAPI.as_view(), name='tournament-start'),
    path('tournament/<int:id>/start-final/', views.TournamentStartFinalAPI.as_view(), name='tournament-start-final'),
    path('tournament/<int:id>/end/', views.TournamentEndAPI.as_view(), name='tournament-end'),
    path('tournament/<int:id>/leave/', views.TournamentLeaveAPI.as_view(), name='tournament-leave'),
    path('tournament/<int:id>/cancel/', views.TournamentCancelAPI.as_view(), name='tournament-cancel'),
]
