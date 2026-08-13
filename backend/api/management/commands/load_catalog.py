import csv
import os
from django.core.management.base import BaseCommand
from api.models import Book
from django.conf import settings

class Command(BaseCommand):
    help = 'Loads data from catalog.csv to SQLite'

    def handle(self, *args, **kwargs):
        # Looks for the CSV one level above the backend folder
        csv_path = os.path.join(settings.BASE_DIR, '..', 'catalog.csv')
        
        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f'Not found: {csv_path}'))
            return

        Book.objects.all().delete() # Clears the DB before loading
        
        books = []
        with open(csv_path, encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                books.append(
                    Book(
                        title=row['title'],
                        author=row['author'],
                        alternate_titles=row['alternate_titles'],
                        format=row['format']
                    )
                )
        
        Book.objects.bulk_create(books)
        self.stdout.write(self.style.SUCCESS(f'Success! {len(books)} books loaded.'))