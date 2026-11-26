# 🌎 FluentFlow — Entrenamiento Completo para Aprender Inglés

Aplicación web interactiva para aprender inglés combinando **memoria de trabajo, repetición espaciada (SRS), lectura con recuerdo activo, escucha/dictado y voces neuronales nativas**.

## Características
- **Plan Maestro y Ruta de 4 Semanas (A1–A2 → B2+):** rutina diaria de 6 pasos, racha, XP, gráfico de evolución y **exportación de estadísticas y vocabulario en CSV**.
- **5 Entrenadores de Inglés:**
  - **Vocabulario SRS** con tarjetas activas, fonética, ejemplos en contexto y creador de tarjetas propias.
  - **Lectura con Recuerdo Activo** (textos graduados + audio + test sin mirar + resumen activo).
  - **Escucha, Dictado y Shadowing** con comparación palabra por palabra.
  - **Constructor de Oraciones y Gramática** interactivo.
  - **Sprint de Memoria de Palabras** (Inglés ↔ Español).
- **Voces Neuronales Nativas (Neural HD):** 5 voces nativas (EE.UU., Reino Unido, Australia) con caché local MP3 vía `server.py` (y respaldo automático con voces del navegador si se abre estáticamente en GitHub Pages).

## Cómo ejecutar con Voces Neuronales HD (Local)
```bash
pip install -r requirements.txt
python server.py
```
Luego abre `http://localhost:8766` en tu navegador.

## Uso estático (GitHub Pages / sin servidor)
También funciona directamente abriendo `index.html` o en GitHub Pages usando las voces naturales del navegador.
