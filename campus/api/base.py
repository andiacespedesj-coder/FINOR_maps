from rest_framework import viewsets


class ReadOnlyCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """La API pública consulta datos; las altas se realizan en Django Admin."""
