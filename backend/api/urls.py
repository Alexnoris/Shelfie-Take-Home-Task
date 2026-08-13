from django.urls import path
from .views import BookMatchView

urlpatterns = [
    path('match/', BookMatchView.as_view(), name='book-match'),
]