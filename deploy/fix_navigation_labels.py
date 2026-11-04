"""Muestra nombres legibles para nodos y conexiones en el admin del VPS.

Uso en el VPS: python3 /root/fix_navigation_labels.py
No modifica registros ni requiere migraciones.
"""

import ast
from datetime import datetime
import os
from pathlib import Path
import shutil
import sys


ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/finor-maps")
MODEL = ROOT / "campus" / "domain" / "navigation.py"
METHODS = {
    "NodoNavegacion": "\n    def __str__(self):\n        return self.nombre\n",
    "ConexionNavegacion": (
        "\n    def __str__(self):\n"
        '        return f"{self.nodo_origen} → {self.nodo_destino}"\n'
    ),
}


def update_source(source):
    tree = ast.parse(source)
    classes = {node.name: node for node in tree.body if isinstance(node, ast.ClassDef)}
    missing = set(METHODS) - set(classes)
    if missing:
        raise RuntimeError(f"No se encontraron los modelos esperados: {', '.join(sorted(missing))}")

    lines = source.splitlines(keepends=True)
    changes = []
    for name, method in METHODS.items():
        model = classes[name]
        if any(isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == "__str__" for node in model.body):
            continue
        changes.append((model.end_lineno, name, method))

    for line_number, _, method in sorted(changes, reverse=True):
        lines.insert(line_number, method)
    updated = "".join(lines)
    compile(updated, str(MODEL), "exec")
    return updated, [name for _, name, _ in changes]


def main():
    original = MODEL.read_text(encoding="utf-8")
    updated, changes = update_source(original)
    if not changes:
        print("Los nombres ya están configurados; solo reinicia el servicio.")
        return

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = MODEL.with_name(f"{MODEL.name}.bak-labels-{stamp}")
    shutil.copy2(MODEL, backup)
    temporary = MODEL.with_name(f".{MODEL.name}.new-{stamp}")
    try:
        shutil.copy2(MODEL, temporary)
        temporary.write_text(updated, encoding="utf-8")
        if hasattr(os, "chown"):
            metadata = MODEL.stat()
            os.chown(temporary, metadata.st_uid, metadata.st_gid)
        os.replace(temporary, MODEL)
    finally:
        temporary.unlink(missing_ok=True)
    print(f"Actualizado: {', '.join(changes)}")
    print(f"Respaldo: {backup}")
    print("No se modificaron los datos ni la base de datos.")


if __name__ == "__main__":
    main()
