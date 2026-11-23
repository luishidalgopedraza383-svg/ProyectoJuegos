# Equipo y ramas de trabajo

Este proyecto se organiza en **tres ramas**: `Fabio`, `Marco` y `Luis`.

| Integrante | Correo | Rama |
| --- | --- | --- |
| Fabio Andrés Céspedes | fabioandrescespedes7890@gmail.com | `Fabio` |
| Marco Alejandro | marcoalej90@gmail.com | `Marco` |
| Luis Hidalgo Pedraza | luishidalgopedraza383@gmail.com | `Luis` |

> **Importante:** por la política de este workspace, el asistente no ejecuta comandos Git que
> creen ramas, historial ni staging. Los comandos siguientes debes ejecutarlos **tú** en tu terminal.

## Crear el repositorio con exactamente 3 ramas

```bash
cd ProyectoJuegos

# Inicializa directamente sobre la rama Fabio (evita crear main/master)
git init -b Fabio

git add .
git commit -m "chore: initial Proyecto Juegos platform scaffold"

git branch Marco
git branch Luis

git branch
# * Fabio
#   Luis
#   Marco
```

Si tu versión de Git no soporta `git init -b`:

```bash
git init
git checkout -b Fabio
git add .
git commit -m "chore: initial Proyecto Juegos platform scaffold"
git branch Marco
git branch Luis
git branch -d master  # elimina la rama inicial vacia; solo si existe
```

## Configurar identidad por rama (opcional, cada integrante en su máquina)

```bash
# En la rama Fabio
git config user.name "Fabio Andrés Céspedes"
git config user.email "fabioandrescespedes7890@gmail.com"

# En la rama Marco
git config user.name "Marco Alejandro"
git config user.email "marcoalej90@gmail.com"

# En la rama Luis
git config user.name "Luis Hidalgo Pedraza"
git config user.email "luishidalgopedraza383@gmail.com"
```

## Flujo de trabajo sugerido

1. Cada integrante trabaja en su rama.
2. Antes de integrar, actualiza desde la rama destino acordada.
3. Revisa los cambios con `git diff` y `git status` antes de hacer `git add`.
4. No subir `.env`, llaves ni secretos.
