"""Punto de entrada de modelos para Django y las migraciones existentes."""

from .domain.catalog import (  # noqa: F401
    AliasLugarCarrera,
    Campus,
    Carrera,
    CategoriaLugar,
    Edificio,
    FotoLugar,
    Lugar,
    Persona,
    Piso,
    PlanoInterior,
    ResponsableUnidad,
    UnidadCarrera,
)
from .domain.navigation import ConexionNavegacion, FlechaFotoRuta, FotoRuta, NodoNavegacion  # noqa: F401
from .domain.transport import LineaTransporte, ParadaTransporte  # noqa: F401
