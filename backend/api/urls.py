from django.urls import path
from .views import BookListView, BookMatchView, ProcessShelfPhotoView

urlpatterns = [
    path('books/', BookListView.as_view(), name='book-list'),
    path('match/', BookMatchView.as_view(), name='book-match'),
    path('process-photo/', ProcessShelfPhotoView.as_view(), name='process-photo'),
]