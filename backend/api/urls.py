from django.urls import path
from .views import BookMatchView, ProcessShelfPhotoView

urlpatterns = [
    path('match/', BookMatchView.as_view(), name='book-match'),
    path('process-photo/', ProcessShelfPhotoView.as_view(), name='process-photo'),
]