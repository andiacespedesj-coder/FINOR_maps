"""Aplica el ajuste del mapa de nodos sin reemplazar otros archivos del VPS."""

from datetime import datetime
from pathlib import Path
import re
import shutil
import sys


ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/finor-maps").resolve()
SETTINGS = ROOT / "FINOR_maps" / "settings.py"
ADMIN = ROOT / "campus" / "admin.py"
TEMPLATE = ROOT / "campus" / "templates" / "campus" / "admin" / "navigation_node_map.html"

MAP_OPTIONS = (
    '    map_template = "campus/admin/navigation_node_map.html"\n'
    '    settings_overrides = {\n'
    '        "DEFAULT_CENTER": (-17.33848, -63.26879),\n'
    '        "DEFAULT_ZOOM": 19,\n'
    '        "SPATIAL_EXTENT": (-63.2720, -17.3410, -63.2650, -17.3350),\n'
    '    }\n'
)


def update_settings(source):
    match = re.search(r"(?ms)^LEAFLET_CONFIG\s*=\s*\{\n.*?^\}", source)
    if not match:
        raise RuntimeError("No se encontró LEAFLET_CONFIG en settings.py")
    block = match.group()
    block = re.sub(r"(?m)^\s*['\"](?:TILES|ATTRIBUTION_PREFIX)['\"]\s*:.*\n", "", block)
    for key, value in (
        ("DEFAULT_CENTER", "(-17.33848, -63.26879)"),
        ("DEFAULT_ZOOM", "18"),
    ):
        line = f"    '{key}': {value},"
        if re.search(rf"(?m)^\s*['\"]{key}['\"]\s*:", block):
            block = re.sub(rf"(?m)^\s*['\"]{key}['\"]\s*:.*$", line, block)
        else:
            block = block.replace("{\n", "{\n" + line + "\n", 1)
    return source[:match.start()] + block + source[match.end():]


def update_admin(source):
    match = re.search(r"(?m)^class NodoNavegacionAdmin\(LeafletGeoAdmin\):\n", source)
    if not match:
        if "@admin.register(NodoNavegacion)" in source:
            raise RuntimeError("Ya existe otro administrador de nodos; no se modificó")
        if not re.search(r"\bNodoNavegacion\b", source):
            raise RuntimeError("NodoNavegacion no está importado en admin.py")

        def remove_plain_registration(registration):
            body = registration.group(1)
            if not re.search(r"\bNodoNavegacion\b", body):
                return registration.group()
            body = re.sub(r"\bNodoNavegacion\s*,\s*", "", body)
            body = re.sub(r",\s*NodoNavegacion\b", "", body)
            return f"admin.site.register(({body}))"

        source = re.sub(
            r"(?ms)^admin\.site\.register\(\((.*?)\)\)",
            remove_plain_registration,
            source,
        )
        source = re.sub(r"(?m)^admin\.site\.register\(NodoNavegacion\)\s*\n", "", source)
        if re.search(r"admin\.site\.register\(NodoNavegacion\s*,", source):
            raise RuntimeError("El nodo está registrado con otra clase; no se modificó")
        return (
            source.rstrip() + "\n\n\n@admin.register(NodoNavegacion)\n"
            "class NodoNavegacionAdmin(LeafletGeoAdmin):\n" + MAP_OPTIONS
            + '    list_display = ("nombre", "tipo", "campus", "piso", "lugar")\n'
            + '    list_filter = ("campus", "tipo", "piso__edificio")\n'
            + '    search_fields = ("nombre", "lugar__nombre")\n'
        )
    end = source.find("\n@admin.register(", match.end())
    section = source[match.end():end if end >= 0 else len(source)]
    if "map_template" in section or "settings_overrides" in section:
        if MAP_OPTIONS in section:
            return source
        raise RuntimeError("El administrador de nodos ya tiene otra configuración de mapa; no se modificó")
    return source[:match.end()] + MAP_OPTIONS + source[match.end():]


def main():
    if not TEMPLATE.is_file():
        raise RuntimeError(f"Falta la plantilla: {TEMPLATE}")
    original_settings = SETTINGS.read_text(encoding="utf-8")
    original_admin = ADMIN.read_text(encoding="utf-8")
    changes = (
        (SETTINGS, original_settings, update_settings(original_settings)),
        (ADMIN, original_admin, update_admin(original_admin)),
    )
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    for path, original, updated in changes:
        if original == updated:
            print(f"Sin cambios: {path}")
            continue
        backup = path.with_name(f"{path.name}.bak-{stamp}")
        shutil.copy2(path, backup)
        path.write_text(updated, encoding="utf-8")
        print(f"Actualizado: {path} (respaldo: {backup})")


if __name__ == "__main__":
    main()
